import { useState } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { launchCamera, CameraOptions, Asset } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KTPPhoto {
  uri: string;
  fileName: string;
  timestamp: string;
  savedToGallery: boolean;
}

export const useKTPCamera = () => {
  const [ktpPhoto, setKtpPhoto] = useState<KTPPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Meminta izin penyimpanan dan mengambil foto KTP
   */
  const takeKTPPhoto = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Hanya berlaku untuk Android
      if (Platform.OS !== 'android') {
        await launchKTPCamera(true);
        return;
      }

      // Cek apakah sudah ada izin
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      if (hasPermission) {
        await launchKTPCamera(true);
        return;
      }

      // Minta izin dengan rationale yang jelas
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: '💾 Izin Penyimpanan untuk Backup Foto KTP',
          message: 'Untuk keamanan data Anda, kami ingin menyimpan foto KTP ke galeri perangkat sebagai backup. Foto akan tersimpan bahkan jika aplikasi diuninstall.',
          buttonPositive: 'Izinkan dan Simpan ke Galeri',
          buttonNegative: 'Tolak, Ambil Foto Saja',
          buttonNeutral: 'Tanya Nanti'
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Storage permission granted');
        await launchKTPCamera(true);
      } else {
        console.log('❌ Storage permission denied');
        await showStorageDeniedAlert();
      }

    } catch (error) {
      console.error('❌ Error in takeKTPPhoto:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengambil foto KTP');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Menampilkan alert ketika izin penyimpanan ditolak
   */
  const showStorageDeniedAlert = async (): Promise<void> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Izin Penyimpanan Ditolak',
        'Foto KTP akan disimpan hanya di aplikasi. Data bisa hilang jika aplikasi diuninstall. Anda masih bisa mengambil foto tanpa backup ke galeri.',
        [
          {
            text: 'Ambil Foto Tanpa Backup',
            onPress: async () => {
              await launchKTPCamera(false);
              resolve();
            },
            style: 'default'
          },
          {
            text: 'Berikan Izin',
            onPress: async () => {
              await takeKTPPhoto(); // Coba lagi
              resolve();
            },
            style: 'cancel'
          },
          {
            text: 'Batal',
            onPress: () => resolve(),
            style: 'destructive'
          }
        ]
      );
    });
  };

  /**
   * Menjalankan kamera dengan opsi saveToPhotos
   */
  const launchKTPCamera = async (saveToGallery: boolean): Promise<void> => {
    try {
      const options: CameraOptions = {
        mediaType: 'photo' as const,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        saveToPhotos: saveToGallery,
        includeBase64: false,
        cameraType: 'back',
        presentationStyle: 'fullScreen'
      };

      console.log(`📸 Launching KTP camera with saveToPhotos: ${saveToGallery}`);

      const result = await launchCamera(options);

      if (result.didCancel) {
        console.log('User cancelled KTP photo');
        return;
      }

      if (result.errorCode) {
        handleCameraError(result.errorCode, result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        await handleKTPPhotoSuccess(result.assets[0], saveToGallery);
      }

    } catch (error) {
      console.error('❌ KTP Camera launch error:', error);
      Alert.alert('Error', 'Gagal membuka kamera untuk mengambil foto KTP');
    }
  };

  /**
   * Handle ketika foto KTP berhasil diambil
   */
  const handleKTPPhotoSuccess = async (photo: Asset, savedToGallery: boolean): Promise<void> => {
    const ktpData: KTPPhoto = {
      uri: photo.uri!,
      fileName: photo.fileName || `ktp_${Date.now()}.jpg`,
      timestamp: new Date().toISOString(),
      savedToGallery: savedToGallery
    };

    // Simpan ke state
    setKtpPhoto(ktpData);

    // Simpan ke AsyncStorage
    try {
      await AsyncStorage.setItem('@ecom:ktpPhoto', JSON.stringify(ktpData));
      console.log('✅ KTP photo saved to app storage');
    } catch (storageError) {
      console.error('❌ Error saving KTP photo:', storageError);
    }

    // Tampilkan alert sukses
    showSuccessAlert(savedToGallery);
  };

  /**
   * Menampilkan alert sukses berdasarkan status penyimpanan
   */
  const showSuccessAlert = (savedToGallery: boolean): void => {
    if (savedToGallery) {
      Alert.alert(
        '✅ Foto KTP Berhasil',
        'Foto KTP telah disimpan di galeri perangkat sebagai backup keamanan dan juga tersimpan di aplikasi.',
        [{ text: 'Mengerti' }]
      );
    } else {
      Alert.alert(
        '✅ Foto KTP Berhasil',
        'Foto KTP telah disimpan di aplikasi. Untuk backup yang lebih aman, izinkan akses penyimpanan di pengaturan.',
        [
          { text: 'Mengerti', style: 'default' },
          {
            text: 'Berikan Izin',
            onPress: () => takeKTPPhoto() // Coba lagi dengan izin
          }
        ]
      );
    }
  };

  /**
   * Handle error kamera
   */
  const handleCameraError = (errorCode: string, errorMessage?: string): void => {
    console.error('Camera error:', errorCode, errorMessage);
    
    let userMessage = 'Gagal mengambil foto KTP';
    
    switch (errorCode) {
      case 'camera_unavailable':
        userMessage = 'Kamera tidak tersedia di perangkat ini';
        break;
      case 'permission':
        userMessage = 'Izin kamera ditolak. Silakan berikan izin kamera di pengaturan.';
        break;
      case 'others':
        userMessage = errorMessage || 'Terjadi kesalahan tidak terduga';
        break;
    }
    
    Alert.alert('Error', userMessage);
  };

  /**
   * Hapus foto KTP
   */
  const clearKTPPhoto = async (): Promise<void> => {
    try {
      setKtpPhoto(null);
      await AsyncStorage.removeItem('@ecom:ktpPhoto');
      console.log('✅ KTP photo cleared');
    } catch (error) {
      console.error('❌ Error clearing KTP photo:', error);
    }
  };

  return {
    ktpPhoto,
    isLoading,
    takeKTPPhoto,
    clearKTPPhoto
  };
};