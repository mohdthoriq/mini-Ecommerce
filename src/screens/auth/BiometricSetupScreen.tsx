// src/screens/settings/BiometricSetupScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Keychain from 'react-native-keychain';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
type FingerprintProfile = {
  id: string;
  name: string;
  finger: string;
  registeredAt: Date;
  isActive: boolean;
};

type BiometricInfo = {
  isAvailable: boolean;
  hasCredentials: boolean;
  type?: string;
  supportedType?: string;
  isEnrolled?: boolean;
};

type FaceIdSupport = {
  isFaceID: boolean;
  supportLevel: 'full' | 'basic' | 'none';
};

const BiometricSetupScreen = () => {
  const navigation = useNavigation();
  const {
    user,
    appSettings,
    enableBiometric,
    disableBiometric,
    isBiometricAvailable,
    biometricLogin,
    securityLockout,
    resetSecurityLockout,
    getSecurityStatus,
    biometryType,
    getBiometricPromptMessage
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    isAvailable: false,
    hasCredentials: false,
    isEnrolled: false,
  });

  const [faceIdSupport, setFaceIdSupport] = useState<FaceIdSupport>({
    isFaceID: false,
    supportLevel: 'none'
  });

  const [fingerprintProfiles, setFingerprintProfiles] = useState<FingerprintProfile[]>([]);
  const [maxFingerprints] = useState(3);

  // Effects
  useEffect(() => {
    checkBiometricStatus();
    loadFingerprintProfiles();
  }, []);

  useEffect(() => {
    checkFaceIdSupport();
  }, [biometryType, biometricInfo]);

  // Storage Functions
  const loadFingerprintProfiles = async () => {
    try {
      const storedProfiles = await AsyncStorage.getItem('fingerprint_profiles');
      if (storedProfiles) {
        const profiles = JSON.parse(storedProfiles).map((profile: any) => ({
          ...profile,
          registeredAt: new Date(profile.registeredAt)
        }));
        setFingerprintProfiles(profiles);
      }
    } catch (error) {
      console.error('Error loading fingerprint profiles:', error);
    }
  };

  const saveFingerprintProfiles = async (profiles: FingerprintProfile[]) => {
    try {
      await AsyncStorage.setItem('fingerprint_profiles', JSON.stringify(profiles));
      setFingerprintProfiles(profiles);
    } catch (error) {
      console.error('Error saving fingerprint profiles:', error);
      throw error;
    }
  };

  // Biometric Functions
  const checkBiometricStatus = async () => {
    try {
      setIsLoading(true);

      const available = await isBiometricAvailable();
      const hasStoredCredentials = await checkStoredCredentials();
      const supportedBiometry = await Keychain.getSupportedBiometryType();
      const enrolled = await checkBiometricEnrollment();

      console.log('Biometric Status:', {
        available,
        hasStoredCredentials,
        supportedBiometry,
        enrolled,
        biometryType
      });

      setBiometricInfo({
        isAvailable: available,
        hasCredentials: hasStoredCredentials && appSettings.biometricEnabled,
        type: getBiometricTypeName(supportedBiometry),
        supportedType: supportedBiometry || undefined,
        isEnrolled: enrolled,
      });

    } catch (error) {
      console.error('Error checking biometric status:', error);
      setBiometricInfo({
        isAvailable: false,
        hasCredentials: false,
        type: 'Not Available',
        isEnrolled: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricEnrollment = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const supportedBiometry = await Keychain.getSupportedBiometryType();
        return supportedBiometry !== null;
      }

      try {
        const result = await Keychain.getGenericPassword({
          service: 'com.ecostore.biometric.enrollment.check',
          authenticationPrompt: {
            title: 'Biometric Check',
            subtitle: 'Verify biometric enrollment',
            description: 'Checking if biometric is set up'
          }
        });
        return true;
      } catch (error: any) {
        if (error.toString().includes('not enrolled') ||
          error.toString().includes('No fingerprints') ||
          error.toString().includes('BIOMETRIC_ERROR_NONE_ENROLLED') ||
          error.toString().includes('No face') ||
          error.toString().includes('Face not enrolled')) {
          return false;
        }
        return true;
      }
    } catch (error) {
      console.log('Enrollment check error:', error);
      return false;
    }
  };

  const checkFaceIdSupport = async () => {
    try {
      const isFaceID = Boolean(
        biometryType === 'FaceID' ||
        biometricInfo.type === 'Face ID' ||
        biometricInfo.supportedType === Keychain.BIOMETRY_TYPE.FACE_ID ||
        (Platform.OS === 'ios' && biometricInfo.type?.includes('Face'))
      );

      console.log('Face ID Support Check:', {
        biometryType,
        biometricType: biometricInfo.type,
        supportedType: biometricInfo.supportedType,
        isFaceID
      });

      const supportLevel = isFaceID ? 'full' : 'none';

      setFaceIdSupport({
        isFaceID,
        supportLevel
      });
    } catch (error) {
      console.log('Face ID support check failed:', error);
      setFaceIdSupport({
        isFaceID: false,
        supportLevel: 'none'
      });
    }
  };

  const checkStoredCredentials = async (): Promise<boolean> => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.ecostore.biometric.credentials'
      });
      return credentials !== false;
    } catch (error) {
      return false;
    }
  };

  const getBiometricTypeName = (biometryType: Keychain.BIOMETRY_TYPE | null): string => {
    if (!biometryType) return 'Not Available';

    switch (biometryType) {
      case Keychain.BIOMETRY_TYPE.FACE_ID:
        return 'Face ID';
      case Keychain.BIOMETRY_TYPE.FACE:
        return 'Face Recognition';
      case Keychain.BIOMETRY_TYPE.TOUCH_ID:
        return 'Touch ID';
      case Keychain.BIOMETRY_TYPE.FINGERPRINT:
        return 'Fingerprint';
      case Keychain.BIOMETRY_TYPE.IRIS:
        return 'Iris Scanner';
      default:
        return biometryType || 'Biometric';
    }
  };

  const getBiometricIcon = () => {
    if (faceIdSupport.isFaceID) return 'face-smile';
    if (biometryType === 'TouchID' || biometryType === 'Fingerprint') return 'fingerprint';

    switch (biometricInfo.supportedType) {
      case Keychain.BIOMETRY_TYPE.FACE_ID:
      case Keychain.BIOMETRY_TYPE.FACE:
        return 'face-smile';
      case Keychain.BIOMETRY_TYPE.TOUCH_ID:
      case Keychain.BIOMETRY_TYPE.FINGERPRINT:
        return 'fingerprint';
      case Keychain.BIOMETRY_TYPE.IRIS:
        return 'eye';
      default:
        return 'id-card';
    }
  };

  const getBiometricDescription = () => {
    if (faceIdSupport.isFaceID) {
      return 'Pindai wajah Anda untuk login yang aman dan cepat';
    } else if (biometricInfo.type?.includes('Fingerprint') || biometricInfo.type?.includes('Touch')) {
      return `Daftarkan hingga ${maxFingerprints} sidik jari untuk akses instan`;
    } else {
      return 'Gunakan biometrik untuk login yang aman dan praktis';
    }
  };

  // Fingerprint Management
  const registerFingerprint = async () => {
    if (fingerprintProfiles.length >= maxFingerprints) {
      Alert.alert(
        'Batas Maksimum',
        `Anda sudah mendaftarkan ${maxFingerprints} sidik jari. Hapus salah satu untuk menambah yang baru.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);

      Alert.prompt(
        'Daftar Sidik Jari Baru',
        'Masukkan nama untuk sidik jari ini (contoh: "Ibu Jari Kanan", "Telunjuk Kiri"):',
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Lanjut',
            onPress: async (fingerName: any) => {
              if (!fingerName || fingerName.trim().length === 0) {
                Alert.alert('Error', 'Nama sidik jari harus diisi');
                return;
              }

              try {
                const result = await biometricLogin();
                
                if (result.success) {
                  const newProfile: FingerprintProfile = {
                    id: Date.now().toString(),
                    name: fingerName.trim(),
                    finger: `Finger ${fingerprintProfiles.length + 1}`,
                    registeredAt: new Date(),
                    isActive: true
                  };

                  const updatedProfiles = [...fingerprintProfiles, newProfile];
                  await saveFingerprintProfiles(updatedProfiles);

                  Alert.alert(
                    'Berhasil!',
                    `Sidik jari "${fingerName}" berhasil didaftarkan!`,
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Gagal', 'Autentikasi sidik jari gagal. Silakan coba lagi.');
                }
              } catch (error) {
                Alert.alert('Error', 'Gagal mendaftarkan sidik jari. Silakan coba lagi.');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        'plain-text'
      );

    } catch (error) {
      console.error('Error registering fingerprint:', error);
      Alert.alert('Error', 'Gagal mendaftarkan sidik jari.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFingerprint = async (profileId: string) => {
    Alert.alert(
      'Hapus Sidik Jari',
      'Apakah Anda yakin ingin menghapus sidik jari ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const updatedProfiles = fingerprintProfiles.filter(profile => profile.id !== profileId);
            await saveFingerprintProfiles(updatedProfiles);
            Alert.alert('Berhasil', 'Sidik jari berhasil dihapus.');
          }
        }
      ]
    );
  };

  const toggleFingerprintActive = async (profileId: string) => {
    const updatedProfiles = fingerprintProfiles.map(profile => 
      profile.id === profileId 
        ? { ...profile, isActive: !profile.isActive }
        : profile
    );
    await saveFingerprintProfiles(updatedProfiles);
  };

  // Biometric Actions
  const handleEnableBiometric = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login first to enable biometric authentication');
      return;
    }

    try {
      setIsLoading(true);

      const success = await enableBiometric({
        username: user.username || 'user',
        password: user.password || 'user_password'
      });

      if (success) {
        await checkBiometricStatus();
        const biometricName = faceIdSupport.isFaceID ? 'Face ID' : (biometryType || 'biometric');

        Alert.alert(
          'Success',
          `${biometricName} telah diaktifkan! Anda sekarang bisa login dengan ${biometricName.toLowerCase()}.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to enable biometric authentication');
      }

    } catch (error: any) {
      console.error('Error enabling biometric:', error);

      if (error.message?.includes('not enrolled') ||
        error.toString().includes('not enrolled') ||
        error.message?.includes('No fingerprints') ||
        error.message?.includes('No face') ||
        error.requiresEnrollment) {

        const biometricName = faceIdSupport.isFaceID ? 'Face ID' : 'sidik jari';
        const settingsUrl = Platform.OS === 'ios'
          ? (faceIdSupport.isFaceID ? 'App-Prefs:FACEID' : 'App-Prefs:TOUCHID_PASSCODE')
          : 'android.settings.SECURITY_SETTINGS';

        Alert.alert(
          'Biometric Not Set Up',
          `Silakan atur ${biometricName} di pengaturan perangkat Anda terlebih dahulu.`,
          [
            {
              text: 'Buka Pengaturan',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL(settingsUrl);
                } else {
                  Linking.openSettings();
                }
              }
            },
            { text: 'Nanti', style: 'cancel' }
          ]
        );
      } else if (error.toString().includes('User canceled') ||
        error.toString().includes('user cancel') ||
        error.toString().includes('Authentication failed')) {
        console.log('User cancelled biometric setup');
      } else if (error.toString().includes('passcode not set')) {
        Alert.alert(
          'Passcode Required',
          'Please set up a device passcode first to use biometric authentication.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('App-Prefs:PASSCODE');
                } else {
                  Linking.openSettings();
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Setup Failed',
          error.message || 'Failed to enable biometric authentication. Please make sure biometric is set up on your device.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    try {
      setIsLoading(true);

      await disableBiometric();
      await AsyncStorage.removeItem('fingerprint_profiles');
      setFingerprintProfiles([]);
      await checkBiometricStatus();

      Alert.alert(
        'Success',
        'Biometric authentication has been disabled.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('Error disabling biometric:', error);
      Alert.alert('Error', 'Failed to disable biometric authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      if (!biometricInfo.isEnrolled) {
        const biometricName = faceIdSupport.isFaceID ? 'Face ID' : 'fingerprint';
        const settingsUrl = Platform.OS === 'ios'
          ? (faceIdSupport.isFaceID ? 'App-Prefs:FACEID' : 'App-Prefs:TOUCHID_PASSCODE')
          : 'android.settings.SECURITY_SETTINGS';

        Alert.alert(
          'Biometric Not Set Up',
          `Please set up ${biometricName} in your device settings first.`,
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL(settingsUrl);
                } else {
                  Linking.openSettings();
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const biometricName = faceIdSupport.isFaceID ? 'Face ID' : (biometryType || 'biometric authentication');

      Alert.alert(
        `Enable ${biometricName}`,
        `Do you want to enable ${biometricName} for login? You will need to authenticate with your ${biometricName.toLowerCase()} to enable this feature.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: handleEnableBiometric
          }
        ]
      );
    } else {
      Alert.alert(
        'Disable Biometric Authentication',
        'Are you sure you want to disable biometric login?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: handleDisableBiometric
          }
        ]
      );
    }
  };

  const handleTestBiometric = async () => {
    try {
      setIsLoading(true);

      const result = await biometricLogin();

      if (result.success) {
        const biometricName = faceIdSupport.isFaceID ? 'Face ID' : (biometryType || 'biometric');
        Alert.alert(
          'Success!',
          `${biometricName} authentication worked perfectly! You can now use ${biometricName.toLowerCase()} to login.`,
          [{ text: 'OK' }]
        );
      } else {
        if (result.error?.includes('User canceled')) {
          console.log('User cancelled biometric test');
        } else {
          Alert.alert(
            'Authentication Failed',
            result.error || 'Biometric verification failed. Please try again.'
          );
        }
      }

    } catch (error: any) {
      console.error('Error testing biometric:', error);

      if (error.toString().includes('User canceled')) {
        console.log('User cancelled biometric test');
      } else {
        Alert.alert(
          'Test Failed',
          error.message || 'Failed to test biometric authentication.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupBiometric = async () => {
    try {
      if (!biometricInfo.isEnrolled) {
        const biometricName = faceIdSupport.isFaceID ? 'Face ID' : 'fingerprint';
        const settingsUrl = Platform.OS === 'ios'
          ? (faceIdSupport.isFaceID ? 'App-Prefs:FACEID' : 'App-Prefs:TOUCHID_PASSCODE')
          : 'android.settings.SECURITY_SETTINGS';

        Alert.alert(
          'Biometric Not Set Up',
          `Please set up ${biometricName} in your device settings first.`,
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL(settingsUrl);
                } else {
                  Linking.openSettings();
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      const biometricName = faceIdSupport.isFaceID ? 'Face ID' : (biometryType || 'biometric authentication');

      Alert.alert(
        `Setup ${biometricName}`,
        `This will set up ${biometricName} for secure login. You'll need to authenticate with your ${biometricName.toLowerCase()} to complete setup.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: handleEnableBiometric
          }
        ]
      );

    } catch (error: any) {
      console.error('Error setting up biometric:', error);
      Alert.alert('Setup Failed', error.message || 'Failed to setup biometric authentication.');
    }
  };

  const handleResetLockout = async () => {
    try {
      resetSecurityLockout();
      await checkBiometricStatus();
      Alert.alert('Success', 'Security lockout has been reset.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset security lockout.');
    }
  };

  // Components
  const SecurityLockoutDisplay = () => {
    const securityStatus = getSecurityStatus();

    return (
      <View style={[
        styles.securityAlert,
        { display: !securityLockout && !securityStatus.isPermanentlyLocked ? 'none' : 'flex' }
      ]}>
        <FontAwesome6 name="shield" size={20} color="#d32f2f" iconStyle='solid' />
        <View style={styles.securityTextContainer}>
          <Text style={styles.securityTitle}>
            {securityStatus.isPermanentlyLocked ? '🚨 Security Lockout' : '⏰ Temporary Lockout'}
          </Text>
          <Text style={styles.securityMessage}>
            {securityStatus.isPermanentlyLocked
              ? 'Biometric authentication permanently disabled due to security concerns.'
              : `Too many failed attempts. Try again in ${securityStatus.timeRemainingMinutes} minutes.`
            }
          </Text>
          <TouchableOpacity onPress={handleResetLockout} style={styles.resetLockoutButton}>
            <Text style={styles.resetLockoutText}>Reset Lockout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const FaceIdFeatureCard = () => {
    return (
      <View style={[styles.faceIdCard, { display: faceIdSupport.isFaceID ? 'flex' : 'none' }]}>
        <View style={styles.faceIdHeader}>
          <FontAwesome6 name="face-smile" size={24} color="#2e7d32" iconStyle='solid' />
          <Text style={styles.faceIdTitle}>Face ID Ready</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
        </View>

        <Text style={styles.faceIdDescription}>
          Advanced facial recognition technology for the most secure and convenient authentication
        </Text>

        <View style={styles.faceIdFeatures}>
          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#4caf50" iconStyle='solid' />
            <Text style={styles.featureText}>3D Face Mapping</Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#4caf50" iconStyle='solid' />
            <Text style={styles.featureText}>Attention Awareness</Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#4caf50" iconStyle='solid' />
            <Text style={styles.featureText}>Secure Enclave Protection</Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#4caf50" iconStyle='solid' />
            <Text style={styles.featureText}>Dark Mode Compatible</Text>
          </View>
        </View>

        <View style={styles.faceIdStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>30k+</Text>
            <Text style={styles.statLabel}>Data Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1/1M</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>⭐️⭐️⭐️⭐️⭐️</Text>
            <Text style={styles.statLabel}>Security</Text>
          </View>
        </View>
      </View>
    );
  };

  const FingerprintFeatureCard = () => {
    return (
      <View style={[
        styles.fingerprintCard, 
        { display: (faceIdSupport.isFaceID || !biometricInfo.isAvailable) ? 'none' : 'flex' }
      ]}>
        <View style={styles.fingerprintHeader}>
          <FontAwesome6 name="fingerprint" size={24} color="#2196f3" iconStyle='solid' />
          <Text style={styles.fingerprintTitle}>Fingerprint System</Text>
          <View style={[styles.badge, { backgroundColor: '#2196f3' }]}>
            <Text style={styles.badgeText}>MULTI-USER</Text>
          </View>
        </View>

        <Text style={styles.fingerprintDescription}>
          Daftarkan hingga {maxFingerprints} sidik jari untuk akses bersama yang aman
        </Text>

        <View style={styles.fingerprintFeatures}>
          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#2196f3" iconStyle='solid' />
            <Text style={[styles.featureText, { color: '#1976d2' }]}>Hingga {maxFingerprints} Sidik Jari</Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#2196f3" iconStyle='solid' />
            <Text style={[styles.featureText, { color: '#1976d2' }]}>Kontrol Individu</Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#2196f3" iconStyle='solid' />
            <Text style={[styles.featureText, { color: '#1976d2' }]}>Akses Keluarga</Text>
          </View>

          <View style={styles.featureItem}>
            <FontAwesome6 name="check" size={16} color="#2196f3" iconStyle='solid' />
            <Text style={[styles.featureText, { color: '#1976d2' }]}>Manajemen Mudah</Text>
          </View>
        </View>

        <View style={styles.fingerprintStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#2196f3' }]}>{fingerprintProfiles.length}</Text>
            <Text style={styles.statLabel}>Terdaftar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#2196f3' }]}>{maxFingerprints}</Text>
            <Text style={styles.statLabel}>Maksimal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#2196f3' }]}>
              {fingerprintProfiles.filter(p => p.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
        </View>
      </View>
    );
  };

  const BiometricSetupButtons = () => {
    const isEnrolled = biometricInfo.isEnrolled ?? false;
    const hasCredentials = biometricInfo.hasCredentials ?? false;
    const isAvailable = biometricInfo.isAvailable ?? false;

    return (
      <View style={{ display: (!isAvailable || hasCredentials) ? 'none' : 'flex' }}>
        {!isEnrolled ? (
          <TouchableOpacity
            style={styles.enrollmentButton}
            onPress={() => {
              const biometricName = faceIdSupport.isFaceID ? 'Face ID' : 'Fingerprint';
              const settingsUrl = Platform.OS === 'ios'
                ? (faceIdSupport.isFaceID ? 'App-Prefs:FACEID' : 'App-Prefs:TOUCHID_PASSCODE')
                : 'android.settings.SECURITY_SETTINGS';

              Alert.alert(
                `Setup ${biometricName} di Perangkat`,
                `Anda perlu mengatur ${biometricName} di pengaturan perangkat terlebih dahulu sebelum bisa menggunakannya di aplikasi.`,
                [
                  {
                    text: 'Buka Pengaturan',
                    onPress: () => {
                      if (Platform.OS === 'ios') {
                        Linking.openURL(settingsUrl);
                      } else {
                        Linking.openSettings();
                      }
                    }
                  },
                  { text: 'Nanti', style: 'cancel' }
                ]
              );
            }}
            disabled={isLoading}
          >
            <View style={styles.enrollmentButtonContent}>
              <FontAwesome6 
                name={faceIdSupport.isFaceID ? "face-smile" : "fingerprint"} 
                size={24} 
                color="#ffffff" 
                iconStyle='solid' 
              />
              <View style={styles.enrollmentButtonText}>
                <Text style={styles.enrollmentButtonMain}>
                  Setup {faceIdSupport.isFaceID ? 'Face ID' : 'Fingerprint'} di Perangkat
                </Text>
                <Text style={styles.enrollmentButtonSub}>
                  Atur {faceIdSupport.isFaceID ? 'wajah Anda' : 'sidik jari'} di pengaturan sistem terlebih dahulu
                </Text>
              </View>
              <FontAwesome6 name="arrow-up-right-from-square" size={16} color="#ffffff" iconStyle='solid' />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={faceIdSupport.isFaceID ? styles.faceIdSetupButton : styles.fingerprintSetupButton}
            onPress={handleSetupBiometric}
            disabled={isLoading || securityLockout}
          >
            <View style={styles.setupButtonContent}>
              <View style={styles.setupIconContainer}>
                <FontAwesome6 
                  name={faceIdSupport.isFaceID ? "face-smile" : "fingerprint"} 
                  size={28} 
                  color="#ffffff" 
                  iconStyle='solid' 
                />
              </View>
              <View style={styles.setupButtonText}>
                <Text style={styles.setupButtonMain}>
                  Aktifkan {faceIdSupport.isFaceID ? 'Face ID' : 'Fingerprint'}
                </Text>
                <Text style={styles.setupButtonSub}>
                  {faceIdSupport.isFaceID 
                    ? 'Gunakan wajah Anda untuk login yang aman' 
                    : 'Gunakan sidik jari untuk akses cepat dan aman'
                  }
                </Text>
              </View>
              <FontAwesome6 name="chevron-right" size={18} color="#ffffff" iconStyle='solid' />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const BiometricStatusCard = () => {
    const isAvailable = biometricInfo.isAvailable ?? false;
    const isEnrolled = biometricInfo.isEnrolled ?? false;
    const hasCredentials = biometricInfo.hasCredentials ?? false;

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[
            styles.statusIconContainer,
            faceIdSupport.isFaceID ? styles.faceIdIcon : styles.fingerprintIcon
          ]}>
            <FontAwesome6
              name={getBiometricIcon()}
              size={28}
              color="#ffffff"
              iconStyle='solid'
            />
          </View>
          <View style={styles.statusTitleContainer}>
            <Text style={styles.statusTitle}>
              {faceIdSupport.isFaceID ? 'Face ID' : (biometryType || biometricInfo.type || 'Biometric Authentication')}
            </Text>
            <Text style={styles.statusSubtitle}>
              {getBiometricDescription()}
            </Text>
          </View>
        </View>

        <View style={styles.statusInfo}>
          <View style={styles.statusItem}>
            <FontAwesome6
              name={isAvailable ? "circle-check" : "circle-xmark"}
              size={16}
              color={isAvailable ? "#4caf50" : "#f44336"}
              iconStyle='solid'
            />
            <Text style={[
              styles.statusText,
              !isAvailable && styles.statusTextDisabled
            ]}>
              {isAvailable ? 'Supported' : 'Not Supported'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <FontAwesome6
              name={isEnrolled ? "user-check" : "user-xmark"}
              size={16}
              color={isEnrolled ? "#4caf50" : "#ff9800"}
              iconStyle='solid'
            />
            <Text style={[
              styles.statusText,
              !isEnrolled && styles.statusTextWarning
            ]}>
              {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <FontAwesome6
              name={hasCredentials ? "lock" : "lock-open"}
              size={16}
              color={hasCredentials ? "#4caf50" : "#9e9e9e"}
              iconStyle='solid'
            />
            <Text style={[
              styles.statusText,
              !hasCredentials && styles.statusTextDisabled
            ]}>
              {hasCredentials ? 'Enabled' : 'Not Set Up'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Checking security settings...</Text>
        </View>
      ) : (
        <>
          {/* Security Lockout Display */}
          <SecurityLockoutDisplay />

          {/* Feature Cards */}
          <FaceIdFeatureCard />
          <FingerprintFeatureCard />

          {/* Status Card */}
          <BiometricStatusCard />

          {/* Setup Button */}
          <BiometricSetupButtons />
          
          {/* Biometric Switch */}
          <View style={[
            styles.settingCard,
            { display: (biometricInfo.isAvailable && biometricInfo.isEnrolled) ? 'flex' : 'none' }
          ]}>
            <View style={styles.settingHeader}>
              <FontAwesome6 name="shield" size={20} color="#2e7d32" iconStyle='solid' />
              <Text style={styles.settingTitle}>
                {faceIdSupport.isFaceID ? 'Face ID' : (biometryType || 'Biometric')} Login
              </Text>
            </View>
            <Text style={styles.settingDescription}>
              Use your {faceIdSupport.isFaceID ? 'face' : (biometryType || 'biometric')?.toLowerCase()} to unlock the app and login securely
            </Text>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                {biometricInfo.hasCredentials ? 'Enabled' : 'Disabled'}
              </Text>
              <Switch
                value={biometricInfo.hasCredentials ?? false}
                onValueChange={handleToggleBiometric}
                disabled={isLoading || securityLockout || !biometricInfo.isEnrolled}
                trackColor={{ false: '#f5f5f5', true: '#c8e6c9' }}
                thumbColor={biometricInfo.hasCredentials ? '#2e7d32' : '#9e9e9e'}
              />
            </View>
          </View>

          {/* Test Button */}
          <TouchableOpacity
            style={[
              styles.testButton,
              faceIdSupport.isFaceID ? styles.faceIdTestButton : styles.fingerprintTestButton,
              { display: biometricInfo.hasCredentials ? 'flex' : 'none' }
            ]}
            onPress={handleTestBiometric}
            disabled={isLoading || securityLockout}
          >
            <FontAwesome6
              name={faceIdSupport.isFaceID ? "face-smile" : "fingerprint"}
              size={18}
              color="#ffffff"
              iconStyle='solid'
            />
            <Text style={styles.testButtonText}>
              Test {faceIdSupport.isFaceID ? 'Face ID' : (biometryType || biometricInfo.type)}
            </Text>
          </TouchableOpacity>

          {/* Information Section */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About Biometric Security</Text>

            <View style={styles.infoItem}>
              <FontAwesome6 name="shield" size={16} color="#2e7d32" iconStyle='solid' />
              <Text style={styles.infoText}>
                Your credentials are encrypted and stored securely in your device's keychain
              </Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome6 name="rocket" size={16} color="#2e7d32" iconStyle='solid' />
              <Text style={styles.infoText}>
                Login instantly without typing passwords
              </Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome6 name="mobile-screen" size={16} color="#2e7d32" iconStyle='solid' />
              <Text style={styles.infoText}>
                Works with your device's built-in security system
              </Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome6 name="key" size={16} color="#2e7d32" iconStyle='solid' />
              <Text style={styles.infoText}>
                Biometric data never leaves your device
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  securityAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 4,
  },
  securityMessage: {
    fontSize: 14,
    color: '#d32f2f',
    lineHeight: 18,
    marginBottom: 8,
  },
  resetLockoutButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#d32f2f',
    borderRadius: 4,
  },
  resetLockoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Feature Cards
  faceIdCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  fingerprintCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  faceIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fingerprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  faceIdTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginLeft: 12,
    flex: 1,
  },
  fingerprintTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196f3',
    marginLeft: 12,
    flex: 1,
  },
  faceIdDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  fingerprintDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  faceIdFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  fingerprintFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#388e3c',
    fontWeight: '500',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  faceIdStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  fingerprintStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  // Profiles Section
  profilesContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  profilesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 4,
  },
  profilesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  profilesList: {
    gap: 12,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 12,
    color: '#666',
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  statusIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusIndicatorText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  addFingerprintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    borderStyle: 'dashed',
    gap: 8,
  },
  addFingerprintText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    color: '#9e9e9e',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#ff9800',
    lineHeight: 16,
  },
  // Setup Buttons
  faceIdSetupButton: {
    backgroundColor: '#2e7d32',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  fingerprintSetupButton: {
    backgroundColor: '#2196f3',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  enrollmentButton: {
    backgroundColor: '#ff9800',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  setupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enrollmentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupButtonText: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  enrollmentButtonText: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  setupButtonMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  enrollmentButtonMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  setupButtonSub: {
    fontSize: 14,
    color: '#e8f5e9',
    opacity: 0.9,
  },
  enrollmentButtonSub: {
    fontSize: 14,
    color: '#fff3e0',
    opacity: 0.9,
  },
  // Status Card
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  faceIdIcon: {
    backgroundColor: '#2e7d32',
  },
  fingerprintIcon: {
    backgroundColor: '#2196f3',
  },
  statusTitleContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statusInfo: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
  },
  statusTextDisabled: {
    color: '#9e9e9e',
  },
  statusTextWarning: {
    color: '#ff9800',
  },
  // Setting Card
  settingCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  // Test Button
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  faceIdTestButton: {
    backgroundColor: '#2e7d32',
  },
  fingerprintTestButton: {
    backgroundColor: '#2196f3',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Info Card
  infoCard: {
    backgroundColor: '#e8f5e9',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#388e3c',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default BiometricSetupScreen;