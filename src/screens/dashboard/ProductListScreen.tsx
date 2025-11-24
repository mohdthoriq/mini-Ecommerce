import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList, Product, ApiProduct } from '../../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useInternet } from '../../context/InternetContext';
import { useNetworkAwareAction } from '../../hooks/useNetworkAwareAction';
import { cacheManager } from '../../utils/cachehelper';
import WishlistButton from '../../routes/WishlistButton';
import { useAuth } from '../../context/AuthContext';
import Geolocation from '@react-native-community/geolocation';

type ProductListScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'ProductList'>;

// Cache keys
const PRODUCTS_CACHE_KEY = 'products_cache';
const CATEGORIES_CACHE_KEY = 'categories_cache';

// Toko Utama coordinates (contoh: Jakarta)
const MAIN_STORE_LAT = -6.2088;
const MAIN_STORE_LON = 106.8456;
const PROMO_RADIUS_METERS = 100; // 100 meter

// Fungsi hitung jarak menggunakan Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Jarak dalam meter

  return distance;
};

const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Izin Akses Lokasi',
        message: 'Kami butuh lokasi Anda untuk menampilkan toko terdekat secara akurat.',
        buttonNeutral: 'Tanya Nanti',
        buttonNegative: 'Tolak',
        buttonPositive: 'Izinkan',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Error requesting location permission:', err);
    return false;
  }
};

const ProductListScreen = () => {
  const navigation = useNavigation<ProductListScreenNavigationProp>();
  const { isInternetReachable } = useInternet();
  const { executeIfOnline } = useNetworkAwareAction();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name' | 'location' | 'nearest'>('name');
  const [locationFilter, setLocationFilter] = useState('');

  // Exponential Backoff State
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [isRetrying, setIsRetrying] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  // Geofencing State
  const [watchId, setWatchId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [distanceToStore, setDistanceToStore] = useState<number | null>(null);
  const [promoShown, setPromoShown] = useState(false);

  // Convert API product to our Product interface
  const convertApiProduct = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id.toString(),
      name: apiProduct.title,
      title: apiProduct.title,
      price: apiProduct.price,
      category: apiProduct.category,
      description: apiProduct.description,
      image: apiProduct.thumbnail,
      discount: apiProduct.discountPercentage,
      isNew: apiProduct.stock > 50
    };
  };

  // Save products to cache
  const saveProductsToCache = async (products: Product[]) => {
    await cacheManager.set(PRODUCTS_CACHE_KEY, products);

    const categories = ['all', ...new Set(products.map(product => product.category))];
    await cacheManager.set(CATEGORIES_CACHE_KEY, categories);
  };

  // Load products from cache
  const loadProductsFromCache = async (): Promise<Product[] | null> => {
    return await cacheManager.get<Product[]>(PRODUCTS_CACHE_KEY);
  };

  // Load categories from cache
  const loadCategoriesFromCache = async (): Promise<string[] | null> => {
    return await cacheManager.get<string[]>(CATEGORIES_CACHE_KEY);
  };

  // Exponential Backoff Delay Calculator
  const getRetryDelay = (attempt: number): number => {
    return Math.pow(2, attempt) * 1000;
  };

  // Fetch products from API with Cache-First Strategy
  const fetchProducts = async (isManualRetry: boolean = false, forceRefresh: boolean = false) => {
    try {
      if (!isInternetReachable) {
        const cachedProducts = await loadProductsFromCache();
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setError('Mode offline - menggunakan data cache');
          setUsingCache(true);
        } else {
          setError('Tidak ada koneksi internet dan tidak ada data cache.');
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isManualRetry) {
        setRetryCount(0);
        setError(null);
        setIsRetrying(false);
        setUsingCache(false);
      }

      setLoading(true);

      if (!forceRefresh) {
        const cachedProducts = await loadProductsFromCache();
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setUsingCache(true);

          fetchFreshProducts();
          return;
        }
      }

      await fetchFreshProducts();

    } catch (err: unknown) {
      handleFetchError(err);
    }
  };

  // Fetch fresh products from API
  const fetchFreshProducts = async () => {
    const currentAttempt = retryCount + 1;

    try {
      await executeIfOnline(async () => {
        const response = await fetch('https://dummyjson.com/products');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.products) {
          const convertedProducts: Product[] = data.products.map((apiProduct: ApiProduct) =>
            convertApiProduct(apiProduct)
          );

          setProducts(convertedProducts);
          setFilteredProducts(convertedProducts);
          setError(null);
          setRetryCount(0);
          setIsRetrying(false);
          setUsingCache(false);

          await saveProductsToCache(convertedProducts);
        }
      }, {
        showAlert: false,
        alertMessage: 'Tidak dapat memuat produk saat offline.'
      });

    } catch (err: unknown) {
      const cachedProducts = await loadProductsFromCache();
      if (cachedProducts && cachedProducts.length > 0) {
        setProducts(cachedProducts);
        setFilteredProducts(cachedProducts);
        setUsingCache(true);
        setError('Gagal memuat data terbaru, menggunakan data cache');
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle fetch errors
  const handleFetchError = async (err: unknown) => {
    let errorMessage = 'Unknown error occurred';

    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = String((err as any).message);
    }

    const cachedProducts = await loadProductsFromCache();
    if (cachedProducts && cachedProducts.length > 0) {
      setProducts(cachedProducts);
      setFilteredProducts(cachedProducts);
      setUsingCache(true);
      setError('Gagal memuat data terbaru, menggunakan data cache');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (errorMessage === 'NO_INTERNET_CONNECTION') {
      setError('Tidak ada koneksi internet. Periksa koneksi Anda.');
      setIsRetrying(false);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (retryCount < maxRetries && isInternetReachable) {
      const delay = getRetryDelay(retryCount);
      const nextAttempt = retryCount + 2;

      setIsRetrying(true);
      setError(`Gagal memuat produk. Mencoba lagi dalam ${delay / 1000} detik... (${retryCount + 1}/${maxRetries})`);

      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, delay);
    } else {
      setIsRetrying(false);
      if (!isInternetReachable) {
        setError('Tidak ada koneksi internet. Periksa koneksi Anda.');
      } else {
        setError(`Gagal memuat produk setelah ${maxRetries + 1} percobaan. ${errorMessage}`);
      }
    }
  };

  // Manual retry function with network check
  const handleManualRetry = () => {
    if (!isInternetReachable) {
      Alert.alert(
        'Tidak Terkoneksi',
        'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.',
        [{ text: 'OK' }]
      );
      return;
    }

    fetchProducts(true, true);
  };

  // Clear cache and refresh
  const handleClearCache = async () => {
    await cacheManager.remove(PRODUCTS_CACHE_KEY);
    await cacheManager.remove(CATEGORIES_CACHE_KEY);
    Alert.alert('Success', 'Cache cleared successfully');
    fetchProducts(false, true);
  };

  // Handle nearest store filter
  const handleNearestStoreFilter = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      setSortBy('nearest');
      Alert.alert('Success', 'Mencari toko terdekat berdasarkan lokasi Anda...');
      // Di sini bisa ditambahkan logika untuk mendapatkan lokasi user dan sorting berdasarkan jarak
    } else {
      Alert.alert(
        'Izin Ditolak',
        'Tidak dapat menampilkan toko terdekat tanpa izin lokasi. Silakan izinkan akses lokasi di pengaturan.',
        [{ text: 'OK' }]
      );
    }
  };


  const startGeofencing = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      console.log('Location permission not granted for geofencing');
      return;
    }

    // Hentikan tracking sebelumnya jika ada
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }

    try {
      const id = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });

          // Hitung jarak ke toko utama
          const distance = calculateDistance(
            latitude,
            longitude,
            MAIN_STORE_LAT,
            MAIN_STORE_LON
          );

          setDistanceToStore(distance);

          console.log(`Jarak ke toko: ${distance.toFixed(2)} meter`);

          // Cek jika dalam radius promo dan belum menampilkan promo
          if (distance <= PROMO_RADIUS_METERS && !promoShown) {
            Alert.alert(
              '🎉 PROMO DEKAT TOKO!',
              `Anda berada dalam ${distance.toFixed(0)} meter dari Toko Utama! Dapatkan promo spesial sekarang!`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setPromoShown(true);
                    // Hentikan tracking setelah promo ditampilkan
                    if (watchId !== null) {
                      Geolocation.clearWatch(watchId);
                      setWatchId(null);
                    }
                  }
                }
              ]
            );
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 50, // Update setiap 50 meter
        }
      );

      setWatchId(id);

    } catch (error) {
      console.error('Error starting geofencing:', error);
    }
  };

  // Stop geofencing
  const stopGeofencing = () => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Cleanup geofencing ketika component unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Apply filters and sorting
  const applyFiltersAndSorting = () => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(locationFilter.toLowerCase()) ||
        product.description.toLowerCase().includes(locationFilter.toLowerCase()) ||
        product.category.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Sort products
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'location':
          return a.category.localeCompare(b.category);
        case 'nearest':
          // Simulasi sorting berdasarkan "jarak" - random untuk demo
          return Math.random() - 0.5;
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    setShowFilterModal(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setSortBy('name');
    setLocationFilter('');
    setSearchQuery('');
    setSelectedCategory('all');
    setFilteredProducts(products);
    setShowFilterModal(false);
  };

  // Handle nearby stores button press
  const handleNearbyStores = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      setSearchQuery('toko terdekat');
      setSortBy('nearest');
      Alert.alert('Success', 'Mencari toko terdekat...');
    }
  };

  // Toggle geofencing
  const toggleGeofencing = async () => {
    if (watchId !== null) {
      stopGeofencing();
      Alert.alert('Info', 'Promo tracking dihentikan');
    } else {
      await startGeofencing();
      Alert.alert('Info', 'Promo tracking diaktifkan. Anda akan mendapat notifikasi ketika berada dalam 100m dari toko.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries && isInternetReachable) {
      fetchProducts();
    }
  }, [retryCount, isInternetReachable]);

  useEffect(() => {
    if (isInternetReachable && error && error.includes('Tidak ada koneksi internet')) {
      setError('Koneksi pulih. Memuat ulang produk...');
      setTimeout(() => {
        fetchProducts(true, true);
      }, 1000);
    }
  }, [isInternetReachable]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [searchQuery, selectedCategory, sortBy, locationFilter, products]);

  const onRefresh = () => {
    if (!isInternetReachable) {
      Alert.alert(
        'Tidak Terkoneksi',
        'Tidak dapat refresh produk saat offline.',
        [{ text: 'OK' }]
      );
      return;
    }

    setRefreshing(true);
    setRetryCount(0);
    setError(null);
    setIsRetrying(false);
    setUsingCache(false);
    fetchProducts(false, true);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const getCategories = () => {
    const categories = ['all', ...new Set(products.map(product => product.category))];
    return categories;
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const calculateDiscountPrice = (price: number, discount?: number) => {
    if (!discount) return price;
    return price - (price * discount / 100);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />

      <View style={styles.wishlistButtonContainer}>
        <WishlistButton
          product={item}
          size={20}
          style={styles.wishlistButton}
        />
      </View>

      <View style={styles.badgeContainer}>
        {item.isNew && (
          <View style={[styles.badge, styles.newBadge]}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}
        {item.discount && item.discount > 0 && (
          <View style={[styles.badge, styles.discountBadge]}>
            <Text style={styles.badgeText}>-{Math.round(item.discount)}%</Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.productCategory}>
          {item.category}
        </Text>

        <View style={styles.priceContainer}>
          {item.discount && item.discount > 0 ? (
            <>
              <Text style={styles.originalPrice}>
                {formatPrice(item.price)}
              </Text>
              <Text style={styles.discountPrice}>
                {formatPrice(calculateDiscountPrice(item.price, item.discount))}
              </Text>
            </>
          ) : (
            <Text style={styles.normalPrice}>
              {formatPrice(item.price)}
            </Text>
          )}
        </View>

        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryChip = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryChip,
        selectedCategory === category && styles.categoryChipSelected
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.categoryTextSelected
      ]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  // Filter Modal Component
  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <FontAwesome6 name="xmark" size={20} color="#666" iconStyle='solid' />
            </TouchableOpacity>
          </View>

          {/* Geofencing Status */}
          <View style={styles.geofencingSection}>
            <Text style={styles.geofencingTitle}>Promo Tracking</Text>
            <View style={styles.geofencingInfo}>
              <FontAwesome6
                name="location-crosshairs"
                size={16}
                color={watchId !== null ? "#2e7d32" : "#666"}
                iconStyle='solid'
              />
              <Text style={styles.geofencingText}>
                Status: {watchId !== null ? 'Aktif' : 'Nonaktif'}
              </Text>
            </View>
            {distanceToStore !== null && (
              <Text style={styles.distanceText}>
                Jarak ke toko: {distanceToStore.toFixed(0)} meter
              </Text>
            )}
            <TouchableOpacity
              style={[
                styles.geofencingButton,
                watchId !== null ? styles.geofencingButtonActive : styles.geofencingButtonInactive
              ]}
              onPress={toggleGeofencing}
            >
              <Text style={styles.geofencingButtonText}>
                {watchId !== null ? 'Hentikan Tracking' : 'Aktifkan Promo Tracking'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Urut Berdasarkan</Text>
            <TouchableOpacity
              style={[
                styles.filterOption,
                sortBy === 'name' && styles.filterOptionSelected
              ]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[
                styles.filterOptionText,
                sortBy === 'name' && styles.filterOptionTextSelected
              ]}>Nama A-Z</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterOption,
                sortBy === 'price_asc' && styles.filterOptionSelected
              ]}
              onPress={() => setSortBy('price_asc')}
            >
              <Text style={[
                styles.filterOptionText,
                sortBy === 'price_asc' && styles.filterOptionTextSelected
              ]}>Harga Terendah</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterOption,
                sortBy === 'price_desc' && styles.filterOptionSelected
              ]}
              onPress={() => setSortBy('price_desc')}
            >
              <Text style={[
                styles.filterOptionText,
                sortBy === 'price_desc' && styles.filterOptionTextSelected
              ]}>Harga Tertinggi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterOption,
                sortBy === 'location' && styles.filterOptionSelected
              ]}
              onPress={() => setSortBy('location')}
            >
              <Text style={[
                styles.filterOptionText,
                sortBy === 'location' && styles.filterOptionTextSelected
              ]}>Lokasi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterOption,
                sortBy === 'nearest' && styles.filterOptionSelected
              ]}
              onPress={handleNearestStoreFilter}
            >
              <View style={styles.nearestStoreOption}>
                <FontAwesome6 name="location-crosshairs" size={14} color={sortBy === 'nearest' ? '#ffffff' : '#666'} iconStyle='solid' />
                <Text style={[
                  styles.filterOptionText,
                  sortBy === 'nearest' && styles.filterOptionTextSelected,
                  styles.nearestStoreText
                ]}>
                  Toko Terdekat
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFiltersAndSorting}
            >
              <Text style={styles.applyButtonText}>Terapkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Show permanent error UI after all retries failed or no internet
  if (error && !isRetrying && (retryCount >= maxRetries || !isInternetReachable)) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome6
          name={isInternetReachable ? "triangle-exclamation" : "wifi"}
          size={64}
          color={isInternetReachable ? "#ff6b6b" : "#6b7280"}
          iconStyle='solid'
        />
        <Text style={styles.errorTitle}>
          {isInternetReachable ? 'Gagal Memuat Produk' : 'Tidak Terkoneksi'}
        </Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.retryInfo}>
          {!isInternetReachable
            ? 'Sambungkan perangkat Anda ke internet'
            : `${maxRetries + 1} percobaan otomatis telah dilakukan`
          }
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            !isInternetReachable && styles.retryButtonOffline
          ]}
          onPress={handleManualRetry}
        >
          <Text style={styles.retryButtonText}>
            {isInternetReachable ? 'Coba Lagi Manual' : 'Coba Lagi'}
          </Text>
        </TouchableOpacity>
        {usingCache && (
          <Text style={styles.cacheIndicator}>
            📱 Sedang menggunakan data cache
          </Text>
        )}
      </View>
    );
  }

  // Show loading with retry info during retries
  if (loading || isRetrying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>
          {isRetrying
            ? `Mencoba lagi... (${retryCount + 1}/${maxRetries})`
            : usingCache ? 'Memuat data cache...' : 'Loading products...'
          }
        </Text>
        {isRetrying && (
          <Text style={styles.retryInfo}>
            Percobaan otomatis {retryCount + 1} dari {maxRetries}
          </Text>
        )}
        {error && isRetrying && (
          <Text style={styles.retryDetail}>{error}</Text>
        )}
        {!isInternetReachable && (
          <Text style={styles.offlineWarning}>
            ⚠️ Sedang offline - menunggu koneksi...
          </Text>
        )}
        {usingCache && (
          <Text style={styles.cacheIndicator}>
            💾 Menggunakan data cache
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Network Status Indicator */}
      {!isInternetReachable && (
        <View style={styles.offlineIndicator}>
          <FontAwesome6 name="wifi" size={14} color="#ffffff" iconStyle='solid' />
          <Text style={styles.offlineIndicatorText}>Mode Offline</Text>
        </View>
      )}

      {/* Cache Status Indicator */}
      {usingCache && (
        <View style={styles.cacheBanner}>
          <FontAwesome6 name="database" size={14} color="#ffffff" iconStyle='solid' />
          <Text style={styles.cacheBannerText}>Menggunakan data cache</Text>
          <TouchableOpacity onPress={handleClearCache} style={styles.clearCacheButton}>
            <Text style={styles.clearCacheText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Temporary Error Banner during retries */}
      {error && isRetrying && (
        <View style={styles.retryBanner}>
          <FontAwesome6 name="clock-rotate-left" size={16} color="#fff" iconStyle='solid' />
          <Text style={styles.retryBannerText}>{error}</Text>
        </View>
      )}

      {/* Geofencing Status Banner */}
      {watchId !== null && (
        <View style={styles.geofencingBanner}>
          <FontAwesome6 name="location-arrow" size={14} color="#ffffff" iconStyle='solid' />
          <Text style={styles.geofencingBannerText}>
            Promo tracking aktif - {distanceToStore ? `${distanceToStore.toFixed(0)}m dari toko` : 'Mencari lokasi...'}
          </Text>
          <TouchableOpacity onPress={stopGeofencing} style={styles.stopTrackingButton}>
            <Text style={styles.stopTrackingText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar dengan Filter Button */}
      <View style={[
        styles.searchContainer,
        !isInternetReachable && styles.searchContainerOffline
      ]}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#666" iconStyle='solid' />
        <TextInput
          style={styles.searchInput}
          placeholder={isInternetReachable ? "Search products..." : "Search (offline mode)"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          editable={isInternetReachable || products.length > 0}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome6 name="xmark" size={16} color="#666" iconStyle='solid' />
          </TouchableOpacity>
        ) : null}

        {/* Nearby Stores Button */}
        <TouchableOpacity
          style={styles.nearbyButton}
          onPress={handleNearbyStores}
        >
          <FontAwesome6 name="location-crosshairs" size={16} color="#2e7d32" iconStyle='solid' />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <FontAwesome6 name="sliders" size={16} color="#666" iconStyle='solid' />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={getCategories()}
          renderItem={({ item }) => renderCategoryChip(item)}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products Count with Online Status */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} products found
          {!isInternetReachable && ' • Offline'}
          {usingCache && ' • Cache'}
          {isAuthenticated && ' • Login'}
          {sortBy !== 'name' && ` • ${getSortByText(sortBy)}`}
          {watchId !== null && ' • Tracking Aktif'}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productsRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2e7d32']}
            enabled={isInternetReachable}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name={isInternetReachable ? "box-open" : "wifi"}
              size={64}
              color="#ccc"
              iconStyle='solid'
            />
            <Text style={styles.emptyText}>
              {isInternetReachable ? 'No products found' : 'Tidak Terkoneksi'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isInternetReachable
                ? 'Try adjusting your search or filter'
                : 'Sambungkan ke internet untuk memuat produk'
              }
            </Text>
          </View>
        }
        contentContainerStyle={styles.productsList}
      />

      {/* Filter Modal */}
      <FilterModal />
    </View>
  );
};

// Helper function to display sort by text
const getSortByText = (sortBy: string) => {
  switch (sortBy) {
    case 'price_asc': return 'Harga Terendah';
    case 'price_desc': return 'Harga Tertinggi';
    case 'name': return 'Nama A-Z';
    case 'location': return 'Lokasi';
    case 'nearest': return 'Toko Terdekat';
    default: return 'Nama A-Z';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
    padding: 16,
  },
  wishlistButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  wishlistButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7f0',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2e7d32',
    textAlign: 'center',
  },
  offlineWarning: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7f0',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  retryInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  retryDetail: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonOffline: {
    backgroundColor: '#6b7280',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryBanner: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  offlineIndicator: {
    backgroundColor: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  offlineIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  geofencingBanner: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  geofencingBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  stopTrackingButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stopTrackingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainerOffline: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    marginLeft: 8,
    padding: 4,
  },
  nearbyButton: {
    marginLeft: 8,
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  productsList: {
    paddingBottom: 16,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '48%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 6,
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountBadge: {
    backgroundColor: '#ff4444',
  },
  newBadge: {
    backgroundColor: '#4caf50',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountPrice: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  normalPrice: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 11,
    color: '#888',
    lineHeight: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  cacheBanner: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cacheBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  clearCacheButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearCacheText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cacheIndicator: {
    fontSize: 14,
    color: '#ff9800',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  geofencingSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  geofencingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  geofencingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  geofencingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
    marginBottom: 12,
  },
  geofencingButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  geofencingButtonActive: {
    backgroundColor: '#dc2626',
  },
  geofencingButtonInactive: {
    backgroundColor: '#2e7d32',
  },
  geofencingButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#2e7d32',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#ffffff',
  },
  nearestStoreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nearestStoreText: {
    marginLeft: 4,
  },
  locationInput: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ProductListScreen;