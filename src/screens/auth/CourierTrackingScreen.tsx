import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';

type CourierTrackingNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CourierTracking'>;

// ✅ DEFINE TYPES MANUAL UNTUK GEOLOCATION
interface GeoPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface GeoError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
  interval?: number;
  fastestInterval?: number;
  useSignificantChanges?: boolean;
}

// Interface untuk data lokasi
interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number | null;
}

// Interface untuk data kurir
interface CourierData {
  id: string;
  name: string;
  vehicle: string;
  plateNumber: string;
  phone: string;
  rating: number;
}

// Interface untuk data order/tracking
interface TrackingOrder {
  id: string;
  orderId: string;
  date: string;
  time: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  estimatedTime?: string;
  courier: CourierData;
  lastLocation?: LocationData;
}

// Interface untuk data yang dikirim ke server
interface ServerLocationData {
  userId: string | undefined;
  orderId: string | undefined;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
  batteryLevel: number | null;
  networkType: string;
  deviceId?: string;
}

const CourierTrackingScreen = () => {
  const navigation = useNavigation<CourierTrackingNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  
  // State untuk tracking
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [courierLocation, setCourierLocation] = useState<LocationData | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(true);
  const [selectedOrder, setSelectedOrder] = useState<TrackingOrder | null>(null);
  const [showOrderList, setShowOrderList] = useState(true);
  const [isSendingLocation, setIsSendingLocation] = useState(false);

  // Refs untuk optimasi
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastSentLocationRef = useRef<LocationData | null>(null);
  const offlineQueueRef = useRef<ServerLocationData[]>([]);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dummy data tracking orders
  const [trackingOrders] = useState<TrackingOrder[]>([
    {
      id: '1',
      orderId: 'ORD-001',
      date: '2024-01-15',
      time: '14:30',
      status: 'shipped',
      total: 125000,
      estimatedTime: '16:00',
      courier: {
        id: 'KUR-001',
        name: 'Ahmad Santoso',
        vehicle: 'Motor',
        plateNumber: 'B 1234 ABC',
        phone: '+62 812-3456-7890',
        rating: 4.8,
      },
      lastLocation: {
        latitude: -6.2088,
        longitude: 106.8456,
        timestamp: Date.now(),
        accuracy: 15,
        speed: 8.5,
      }
    },
    {
      id: '2',
      orderId: 'ORD-002',
      date: '2024-01-14',
      time: '09:15',
      status: 'delivered',
      total: 89000,
      courier: {
        id: 'KUR-002',
        name: 'Budi Pratama',
        vehicle: 'Motor',
        plateNumber: 'B 5678 DEF',
        phone: '+62 813-9876-5432',
        rating: 4.9,
      },
      lastLocation: {
        latitude: -6.2095,
        longitude: 106.8462,
        timestamp: Date.now() - 86400000,
        accuracy: 10,
        speed: 0,
      }
    }
  ]);

  // ✅ FUNGSI: DAPATKAN LOKASI DENGAN OPTIMASI maximumAge (FIXED)
  const getCurrentLocationWithOptimization = (): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      const options: GeoOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 120000
      };

      Geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 GPS data obtained (with maximumAge optimization)');
          resolve(position as GeoPosition);
        },
        (error) => {
          console.error('❌ Error getting location:', error);
          reject(error as GeoError);
        },
        options
      );
    });
  };

  // ✅ FUNGSI BANTUAN: KIRIM DATA KE SERVER API dengan timeout yang benar
  const sendToServerAPI = async (locationData: ServerLocationData): Promise<void> => {
    try {
      // Buat AbortController untuk timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.yourapp.com/tracking/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(locationData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Lokasi berhasil dikirim ke server');
      } else {
        console.warn('⚠️ Server response not OK:', response.status);
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout setelah 10 detik');
        throw new Error('Request timeout');
      }
      console.error('❌ Gagal mengirim ke server API:', error);
      throw error;
    }
  };

  // ✅ FUNGSI UTAMA: KIRIM LOKASI KE SERVER DENGAN OPTIMASI HEMAT DATA
  const sendLocationToServer = async (position: GeoPosition): Promise<void> => {
    if (isSendingLocation) {
      console.log('⏳ Skip - sedang mengirim lokasi sebelumnya');
      return;
    }

    setIsSendingLocation(true);
    
    try {
      const now = Date.now();
      const lastSent = lastSentLocationRef.current;
      
      // 🔍 CEK PERUBAHAN SIGNIFIKAN: Skip jika pergerakan < 50 meter
      if (lastSent) {
        const distance = calculateDistance(
          lastSent.latitude,
          lastSent.longitude,
          position.coords.latitude,
          position.coords.longitude
        );
        
        if (distance < 50 && (now - lastSent.timestamp) < 120000) {
          console.log('📍 Skip mengirim lokasi - perubahan tidak signifikan (< 50m dalam 2m)');
          return;
        }
      }

      // 📦 PREPARE DATA UNTUK DIKIRIM KE SERVER
      const locationData: ServerLocationData = {
        userId: user?.id,
        orderId: selectedOrder?.orderId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        timestamp: now,
        batteryLevel: null,
        networkType: isOnline ? 'online' : 'offline',
        deviceId: Platform.OS + '_' + Platform.Version
      };

      console.log('📡 Mengirim lokasi ke server:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy?.toFixed(1),
        speed: locationData.speed?.toFixed(1)
      });

      // 🌐 KIRIM KE SERVER ATAU SIMPAN DI OFFLINE QUEUE
      if (isOnline) {
        await sendToServerAPI(locationData);
        
        lastSentLocationRef.current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: now,
          accuracy: position.coords.accuracy
        };
      } else {
        offlineQueueRef.current.push(locationData);
        console.log('💾 Disimpan di offline queue:', offlineQueueRef.current.length, 'items');
        
        if (offlineQueueRef.current.length > 100) {
          offlineQueueRef.current = offlineQueueRef.current.slice(-50);
        }
      }

    } catch (error: any) {
      console.error('❌ Error dalam sendLocationToServer:', error);
    } finally {
      setIsSendingLocation(false);
    }
  };

  // ✅ FUNGSI: PROSES OFFLINE QUEUE KETIKA ONLINE KEMBALI
  const processOfflineQueue = async (): Promise<void> => {
    if (offlineQueueRef.current.length === 0 || !isOnline) {
      return;
    }

    console.log('🔄 Memproses offline queue:', offlineQueueRef.current.length, 'items');
    
    try {
      const itemsToProcess = offlineQueueRef.current.splice(0, 10);
      
      for (const item of itemsToProcess) {
        try {
          await sendToServerAPI(item);
          console.log('✅ Offline item berhasil dikirim:', item.timestamp);
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.warn('⚠️ Gagal mengirim offline item, mengembalikan ke queue');
          offlineQueueRef.current.unshift(item);
          break;
        }
      }
    } catch (error: any) {
      console.error('❌ Error processing offline queue:', error);
    }
  };

  // ✅ EFFECT: PERIODIC LOCATION UPDATES DENGAN OPTIMASI
  useEffect(() => {
    if (isTracking && isOnline) {
      locationIntervalRef.current = setInterval(async () => {
        try {
          const position = await getCurrentLocationWithOptimization();
          console.log('📍 Periodic location update (optimized)');
          await sendLocationToServer(position);
          
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed
          });

        } catch (error: any) {
          console.warn('⚠️ Gagal mendapatkan lokasi periodic:', error);
        }
      }, 30000);
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isTracking, isOnline]);

  // ✅ EFFECT: PROSES OFFLINE QUEUE KETIKA ONLINE
  useEffect(() => {
    if (isOnline && offlineQueueRef.current.length > 0) {
      console.log('🌐 Koneksi online, memproses offline queue...');
      processOfflineQueue();
    }
  }, [isOnline]);

  // ✅ EFFECT: CEK KONEKSI INTERNET
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);
      
      if (!online && isTracking) {
        console.log('📵 Koneksi terputus, pausing tracking...');
        Alert.alert(
          'Koneksi Terputus',
          'Tracking dijeda karena koneksi internet terputus. Data disimpan secara lokal dan akan dilanjutkan ketika online.',
          [{ text: 'OK' }]
        );
        stopTracking();
      }
      
      if (online && offlineQueueRef.current.length > 0) {
        processOfflineQueue();
      }
    });

    return () => unsubscribe();
  }, [isTracking]);

  // ✅ FUNGSI: HITUNG JARAK (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance * 1000;
  };

  // ✅ FUNGSI: SIMULASI LOKASI KURIR
  const getSimulatedCourierLocation = (): LocationData => {
    if (!selectedOrder?.lastLocation) {
      return {
        latitude: -6.2088,
        longitude: 106.8456,
        timestamp: Date.now(),
        accuracy: 10,
        speed: Math.random() * 10 + 5,
      };
    }

    const baseLat = selectedOrder.lastLocation.latitude;
    const baseLng = selectedOrder.lastLocation.longitude;
    const randomOffset = () => (Math.random() - 0.5) * 0.001;
    
    return {
      latitude: baseLat + randomOffset(),
      longitude: baseLng + randomOffset(),
      timestamp: Date.now(),
      accuracy: 10 + Math.random() * 10,
      speed: Math.random() * 10 + 5,
    };
  };

  // ✅ FUNGSI: REQUEST LOCATION PERMISSION
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Izin Akses Lokasi',
          message: 'Dibutuhkan untuk melacak pergerakan kurir secara real-time dengan optimasi hemat baterai dan data.',
          buttonNeutral: 'Tanya Nanti',
          buttonNegative: 'Tolak',
          buttonPositive: 'Izinkan',
        }
      );
      
      const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(hasPermission);
      return hasPermission;
    } catch (err) {
      console.warn('Error requesting location permission:', err);
      return false;
    }
  };

  // ✅ FUNGSI: MULAI TRACKING DENGAN SEMUA OPTIMASI
  const startTracking = async () => {
    try {
      if (!isOnline) {
        Alert.alert('Tidak Ada Koneksi', 'Live tracking membutuhkan koneksi internet.', [{ text: 'OK' }]);
        return;
      }

      if (!user) {
        Alert.alert('Login Diperlukan', 'Silakan login untuk menggunakan fitur live tracking.', [
          { text: 'Batal', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }

      console.log('🚀 Memulai tracking kurir dengan optimasi hemat data...');
      
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        Alert.alert('Izin Ditolak', 'Tidak dapat melacak kurir tanpa izin lokasi.', [{ text: 'OK' }]);
        return;
      }

      setIsTracking(true);
      startTimeRef.current = Date.now();

      // 🎯 DAPATKAN LOKASI AWAL DENGAN OPTIMASI
      try {
        const initialPosition = await getCurrentLocationWithOptimization();
        await sendLocationToServer(initialPosition);
        
        setCurrentLocation({
          latitude: initialPosition.coords.latitude,
          longitude: initialPosition.coords.longitude,
          timestamp: initialPosition.timestamp,
          accuracy: initialPosition.coords.accuracy,
          speed: initialPosition.coords.speed
        });
      } catch (error) {
        console.warn('⚠️ Gagal mendapatkan lokasi awal:', error);
      }

      // ⏰ SETUP TIMER UNTUK ELAPSED TIME
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // 📍 MULAI LIVE TRACKING DENGAN WATCHPOSITION
      const options: GeoOptions = {
        enableHighAccuracy: true,
        distanceFilter: 20,
        interval: 5000,
        fastestInterval: 3000,
        maximumAge: 120000
      };

      const id = Geolocation.watchPosition(
        (position) => {
          const positionData = position as GeoPosition;
          const { latitude, longitude, accuracy, speed } = positionData.coords;
          const newLocation: LocationData = {
            latitude,
            longitude,
            timestamp: positionData.timestamp,
            accuracy,
            speed,
          };

          setCurrentLocation(newLocation);
          sendLocationToServer(positionData).catch(error => {
            console.warn('⚠️ Gagal mengirim lokasi:', error);
          });

          const courierLoc = getSimulatedCourierLocation();
          setCourierLocation(courierLoc);

          if (lastLocationRef.current) {
            const distance = calculateDistance(
              lastLocationRef.current.latitude,
              lastLocationRef.current.longitude,
              courierLoc.latitude,
              courierLoc.longitude
            );
            
            if (distance > 0) {
              setDistanceTraveled(prev => prev + distance);
            }
          }

          lastLocationRef.current = courierLoc;
        },
        (error) => {
          const errorData = error as GeoError;
          console.error('❌ Error tracking:', errorData);
          let errorMessage = 'Gagal melacak lokasi';
          
          switch (errorData.code) {
            case 1:
              errorMessage = 'Izin lokasi ditolak';
              break;
            case 2:
              errorMessage = 'Lokasi tidak tersedia';
              break;
            case 3:
              errorMessage = 'Timeout mendapatkan lokasi';
              break;
          }
          
          Alert.alert('Tracking Error', errorMessage);
          stopTracking();
        },
        options
      );

      setWatchId(id);
      console.log('✅ Tracking started dengan optimasi hemat data');

    } catch (error) {
      console.error('❌ Error starting tracking:', error);
      Alert.alert('Error', 'Gagal memulai tracking');
    }
  };

  // ✅ FUNGSI: HENTIKAN TRACKING
  const stopTracking = () => {
    console.log('🛑 Menghentikan tracking...');
    
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    
    setIsTracking(false);
    setElapsedTime(0);
    setDistanceTraveled(0);
    lastLocationRef.current = null;
    setIsSendingLocation(false);
  };

  // ✅ FUNGSI: FORMAT WAKTU
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}j ${mins}m ${secs}d`;
    }
    return `${mins}m ${secs}d`;
  };

  // ✅ FUNGSI: FORMAT JARAK
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // ✅ FUNGSI: ESTIMASI WAKTU SAMPAI
  const getEstimatedArrival = (): string => {
    if (!courierLocation?.speed || courierLocation.speed === 0) {
      return 'Menghitung...';
    }
    
    const remainingDistance = 5000 - distanceTraveled;
    if (remainingDistance <= 0) {
      return 'Sudah sampai!';
    }
    
    const remainingTime = remainingDistance / courierLocation.speed;
    const arrivalTime = new Date(Date.now() + remainingTime * 1000);
    
    return arrivalTime.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ✅ FUNGSI: PILIH ORDER
  const handleSelectOrder = (order: TrackingOrder) => {
    setSelectedOrder(order);
    setShowOrderList(false);
    
    if (isTracking) {
      stopTracking();
    }
    
    if (order.lastLocation) {
      setCourierLocation(order.lastLocation);
      lastLocationRef.current = order.lastLocation;
    }
  };

  // ✅ CLEANUP EFFECT
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up tracking resources...');
      stopTracking();
    };
  }, []);

  // ✅ AUTO-SELECT ORDER PERTAMA
  useEffect(() => {
    if (trackingOrders.length > 0 && !selectedOrder) {
      const activeOrder = trackingOrders.find(order => order.status === 'shipped') || trackingOrders[0];
      setSelectedOrder(activeOrder);
    }
  }, [trackingOrders, selectedOrder]);

  // ✅ HANDLE TOGGLE TRACKING
  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // ✅ HANDLE BACK NAVIGATION
  const handleBack = () => {
    if (showOrderList) {
      navigation.goBack();
    } else {
      setShowOrderList(true);
    }
  };

  // ✅ HEADER RIGHT COMPONENT
  const HeaderRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={[
        styles.networkStatus,
        isOnline ? styles.networkOnline : styles.networkOffline
      ]}>
        <Text style={styles.networkStatusText}>
          {isOnline ? '🟢' : '🔴'}
        </Text>
      </View>
      {isSendingLocation && (
        <ActivityIndicator size="small" color="#ffffff" />
      )}
    </View>
  );
  const renderOrderList = () => (
    <View style={styles.container}>
      <Header 
        title="Riwayat Tracking"
        showBackButton={true}
        rightComponent={<HeaderRight />}
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Order untuk Dilacak</Text>
          <Text style={styles.sectionSubtitle}>
            Pilih salah satu order untuk melihat detail tracking kurir
          </Text>

          {trackingOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => handleSelectOrder(order)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>{order.orderId}</Text>
                  <Text style={styles.orderDateTime}>
                    {order.date} • {order.time}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  order.status === 'shipped' && styles.statusShipped,
                  order.status === 'delivered' && styles.statusDelivered,
                  order.status === 'pending' && styles.statusPending,
                  order.status === 'cancelled' && styles.statusCancelled,
                ]}>
                  <Text style={styles.statusText}>
                    {order.status === 'shipped' ? 'Dikirim' : 
                     order.status === 'delivered' ? 'Sampai' :
                     order.status === 'pending' ? 'Pending' : 'Dibatalkan'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <FontAwesome6 name="truck" size={14} color="#6b7280" iconStyle='solid' />
                  <Text style={styles.detailText}>{order.courier.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome6 name="money-bill" size={14} color="#6b7280" iconStyle='solid' />
                  <Text style={styles.detailText}>
                    Rp {order.total.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.trackText}>
                  Ketuk untuk melacak →
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // Render Tracking Detail
  const renderTrackingDetail = () => (
    <View style={styles.container}>
      <Header 
        title="Lacak Kurir"
        showBackButton={true}
        rightComponent={<HeaderRight />}
        onBack={() => setShowOrderList(true)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Order */}
        <View style={styles.section}>
          <View style={styles.orderBanner}>
            <Text style={styles.orderBannerId}>{selectedOrder?.orderId}</Text>
            <Text style={styles.orderBannerDate}>
              {selectedOrder?.date} • {selectedOrder?.time}
            </Text>
          </View>
        </View>

        {/* Info Status Pengiriman */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Pengiriman</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.statusRow}>
              <FontAwesome6 
                name={isTracking ? "truck-fast" : "truck"} 
                size={24} 
                color="#059669" 
                iconStyle='solid' 
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {isTracking ? 'Sedang Berjalan' : 'Berhenti'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isTracking ? 'Kurir dalam perjalanan ke lokasi Anda' : 'Tracking dihentikan'}
                </Text>
              </View>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.statLabel}>Waktu</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDistance(distanceTraveled)}</Text>
                <Text style={styles.statLabel}>Jarak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {courierLocation?.speed ? `${courierLocation.speed.toFixed(1)} m/s` : '0 m/s'}
                </Text>
                <Text style={styles.statLabel}>Kecepatan</Text>
              </View>
            </View>

            {/* Network Status Indicator */}
            {!isOnline && (
              <View style={styles.offlineWarning}>
                <FontAwesome6 name="wifi" size={16} color="#ffffff" iconStyle='solid' />
                <Text style={styles.offlineWarningText}>
                  Mode Offline - Live tracking tidak tersedia
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Kurir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Kurir</Text>
          <View style={styles.courierCard}>
            <View style={styles.courierHeader}>
              <View style={styles.courierAvatar}>
                <FontAwesome6 name="user" size={24} color="#ffffff" iconStyle='solid' />
              </View>
              <View style={styles.courierInfo}>
                <Text style={styles.courierName}>{selectedOrder?.courier.name}</Text>
                <Text style={styles.courierId}>{selectedOrder?.courier.id}</Text>
              </View>
              <View style={styles.rating}>
                <FontAwesome6 name="star" size={14} color="#f59e0b" iconStyle='solid' />
                <Text style={styles.ratingText}>{selectedOrder?.courier.rating}</Text>
              </View>
            </View>
            
            <View style={styles.courierDetails}>
              <View style={styles.detailRow}>
                <FontAwesome6 name="motorcycle" size={16} color="#6b7280" iconStyle='solid' />
                <Text style={styles.detailText}>
                  {selectedOrder?.courier.vehicle} • {selectedOrder?.courier.plateNumber}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome6 name="phone" size={16} color="#6b7280" iconStyle='solid' />
                <Text style={styles.detailText}>{selectedOrder?.courier.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Lokasi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokasi</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.courierDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Lokasi Kurir</Text>
                <Text style={styles.locationText}>
                  {courierLocation 
                    ? `${courierLocation.latitude.toFixed(6)}, ${courierLocation.longitude.toFixed(6)}`
                    : 'Mendeteksi lokasi...'
                  }
                </Text>
                <Text style={styles.locationTime}>
                  Akurasi: {courierLocation?.accuracy?.toFixed(1) || '0'} meter
                </Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.destinationDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Tujuan Pengiriman</Text>
                <Text style={styles.locationText}>Lokasi Anda</Text>
                <Text style={styles.locationTime}>
                  Estimasi sampai: {getEstimatedArrival()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tracking Controls */}
        <View style={styles.section}>
          <View style={styles.controlsCard}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isTracking ? styles.stopButton : styles.startButton,
                !isOnline && styles.disabledButton
              ]}
              onPress={handleToggleTracking}
              disabled={!isOnline}
            >
              {isTracking ? (
                <>
                  <FontAwesome6 name="pause" size={20} color="#ffffff" iconStyle='solid' />
                  <Text style={styles.controlButtonText}>Jeda Tracking</Text>
                </>
              ) : (
                <>
                  <FontAwesome6 name="play" size={20} color="#ffffff" iconStyle='solid' />
                  <Text style={styles.controlButtonText}>
                    {isOnline ? 'Mulai Live Tracking' : 'Tunggu Koneksi'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {!isOnline && (
              <Text style={styles.offlineHint}>
                Live tracking membutuhkan koneksi internet
              </Text>
            )}
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                Alert.alert(
                  'Hubungi Kurir',
                  `Hubungi ${selectedOrder?.courier.name} di ${selectedOrder?.courier.phone}?`,
                  [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Hubungi', onPress: () => console.log('Memanggil kurir...') }
                  ]
                );
              }}
            >
              <FontAwesome6 name="phone" size={16} color="#3b82f6" iconStyle='solid' />
              <Text style={styles.secondaryButtonText}>Hubungi Kurir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return showOrderList ? renderOrderList() : renderTrackingDetail();
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusInactive: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  deliveryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  courierCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  courierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courierAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courierInfo: {
    flex: 1,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  courierId: {
    fontSize: 14,
    color: '#6b7280',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
    marginLeft: 4,
  },
  courierDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  courierDot: {
    backgroundColor: '#3b82f6',
  },
  destinationDot: {
    backgroundColor: '#ef4444',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationTime: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#059669',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  debugCard: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  debugText: {
    fontSize: 12,
    color: '#92400e',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 4,
  },
  networkStatus: {
    padding: 6,
    borderRadius: 8,
  },
  networkOnline: {
    backgroundColor: '#dcfce7',
  },
  networkOffline: {
    backgroundColor: '#fecaca',
  },
  networkStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderDateTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusShipped: {
    backgroundColor: '#dbeafe',
  },
  statusDelivered: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusCancelled: {
    backgroundColor: '#fecaca',
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  trackText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  // Order Banner
  orderBanner: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderBannerId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  orderBannerDate: {
    fontSize: 14,
    color: '#dbeafe',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  offlineWarningText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  offlineHint: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default CourierTrackingScreen;