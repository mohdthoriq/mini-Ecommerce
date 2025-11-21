import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { launchCamera, launchImageLibrary, CameraOptions, Asset } from 'react-native-image-picker';

/**
 * Meminta izin penyimpanan dan mengambil foto KTP dengan backup ke galeri
 */
export const requestStoragePermissionAndSave = async (): Promise<Asset | null> => {
  try {
    // Hanya berlaku untuk Android (iOS tidak perlu izin WRITE_EXTERNAL_STORAGE)
    if (Platform.OS !== 'android') {
      return await launchCameraWithSaveOption(true);
    }

    console.log('🔐 Meminta izin penyimpanan untuk Android...');

    // Cek dan minta izin WRITE_EXTERNAL_STORAGE
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Izin Penyimpanan untuk Backup Foto KTP',
        message: 'Aplikasi membutuhkan akses penyimpanan untuk menyimpan foto KTP ke galeri sebagai backup keamanan. Foto akan tersimpan bahkan jika aplikasi diuninstall.',
        buttonPositive: 'Izinkan',
        buttonNegative: 'Tolak',
        buttonNeutral: 'Tanya Nanti'
      }
    );

    console.log(`📋 Hasil permintaan izin: ${granted}`);

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('✅ Izin penyimpanan diberikan');
      return await launchCameraWithSaveOption(true);
    } else {
      console.log('❌ Izin penyimpanan ditolak');
      // Tampilkan alert rationale
      return await showStorageDeniedAlert();
    }

  } catch (error) {
    console.error('❌ Error dalam requestStoragePermissionAndSave:', error);
    Alert.alert('Error', 'Terjadi kesalahan saat meminta izin penyimpanan');
    return null;
  }
};

/**
 * Menampilkan alert ketika izin penyimpanan ditolak
 */
const showStorageDeniedAlert = (): Promise<Asset | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Izin Penyimpanan Ditolak',
      'Foto KTP tidak akan disimpan di galeri publik. Foto hanya akan tersimpan di aplikasi dan bisa hilang jika data aplikasi dihapus.',
      [
        {
          text: 'Ambil Foto Tanpa Backup',
          onPress: async () => {
            const result = await launchCameraWithSaveOption(false);
            resolve(result);
          },
          style: 'default'
        },
        {
          text: 'Berikan Izin',
          onPress: async () => {
            // Coba lagi meminta izin
            const result = await requestStoragePermissionAndSave();
            resolve(result);
          },
          style: 'cancel'
        },
        {
          text: 'Batal',
          onPress: () => resolve(null),
          style: 'destructive'
        }
      ],
      { cancelable: false }
    );
  });
};

/**
 * ✅ PENANGANAN ERROR: Handle error kamera tidak tersedia
 */
const handleCameraUnavailableError = (): Promise<Asset | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Kamera Tidak Tersedia',
      'Kamera tidak bisa dibuka. Mungkin sedang digunakan oleh aplikasi lain atau terjadi kerusakan. Gunakan Galeri untuk memilih foto yang sudah ada?',
      [
        {
          text: 'Buka Galeri',
          onPress: async () => {
            try {
              const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                maxWidth: 1024,
                maxHeight: 1024,
                quality: 0.8,
              });

              if (result.didCancel) {
                console.log('User cancelled gallery selection');
                resolve(null);
                return;
              }

              if (result.errorCode) {
                console.error('Gallery error:', result.errorCode, result.errorMessage);
                Alert.alert('Error', 'Gagal membuka galeri');
                resolve(null);
                return;
              }

              if (result.assets && result.assets.length > 0) {
                const photo = result.assets[0];
                Alert.alert('✅ Berhasil', 'Foto berhasil dipilih dari galeri');
                resolve(photo);
              } else {
                resolve(null);
              }
            } catch (error) {
              console.error('Error opening gallery:', error);
              Alert.alert('Error', 'Gagal membuka galeri');
              resolve(null);
            }
          },
          style: 'default'
        },
        {
          text: 'Coba Lagi',
          onPress: async () => {
            // Coba buka kamera lagi
            const result = await launchCameraWithSaveOption(false);
            resolve(result);
          }
        },
        {
          text: 'Batal',
          onPress: () => resolve(null),
          style: 'cancel'
        }
      ]
    );
  });
};

/**
 * Fungsi untuk menjalankan kamera dengan opsi saveToPhotos dan error handling
 */
const launchCameraWithSaveOption = async (saveToPhotos: boolean): Promise<Asset | null> => {
  try {
    const options: CameraOptions = {
      mediaType: 'photo' as const,
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      saveToPhotos: saveToPhotos,
      includeBase64: false,
      cameraType: 'back',
      presentationStyle: 'fullScreen'
    };

    console.log(`📸 Launching camera with saveToPhotos: ${saveToPhotos}`);

    const result = await launchCamera(options);

    // ✅ PENANGANAN ERROR: Camera unavailable
    if (result.errorCode === 'camera_unavailable') {
      console.error('❌ Camera unavailable error');
      return await handleCameraUnavailableError();
    }

    if (result.didCancel) {
      console.log('User membatalkan pengambilan foto');
      return null;
    }

    if (result.errorCode) {
      console.error('Camera error:', result.errorCode, result.errorMessage);
      
      // ✅ PENANGANAN ERROR LAINNYA
      let errorMessage = 'Gagal mengambil foto';
      switch (result.errorCode) {
        case 'permission':
          errorMessage = 'Izin kamera ditolak. Silakan berikan izin kamera di pengaturan.';
          break;
        case 'others':
          errorMessage = result.errorMessage || 'Terjadi kesalahan tidak terduga';
          break;
      }
      
      Alert.alert('Error', errorMessage);
      return null;
    }

    if (result.assets && result.assets.length > 0) {
      const photo = result.assets[0];
      
      // Tampilkan alert sukses berdasarkan status penyimpanan
      if (saveToPhotos) {
        Alert.alert(
          '✅ Foto KTP Berhasil', 
          'Foto KTP berhasil diambil dan disimpan di galeri sebagai backup keamanan.',
          [{ text: 'Mengerti' }]
        );
      } else {
        Alert.alert(
          '✅ Foto KTP Berhasil', 
          'Foto KTP berhasil diambil. Foto hanya tersimpan di aplikasi.',
          [{ text: 'Mengerti' }]
        );
      }

      console.log('📸 Photo taken:', {
        uri: photo.uri,
        savedToGallery: saveToPhotos,
        fileName: photo.fileName
      });

      return photo;
    } else {
      Alert.alert('Error', 'Tidak ada foto yang berhasil diambil');
      return null;
    }

  } catch (error) {
    console.error('❌ Camera launch error:', error);
    
    // ✅ PENANGANAN ERROR: Generic camera error
    Alert.alert(
      'Error',
      'Gagal membuka kamera. Coba lagi atau gunakan galeri untuk memilih foto.',
      [
        {
          text: 'Buka Galeri',
          onPress: async () => {
            // Fallback ke gallery
            const result = await launchImageLibrary({
              mediaType: 'photo',
              selectionLimit: 1,
            });
            // Handle gallery result jika diperlukan
          }
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
    
    return null;
  }
};