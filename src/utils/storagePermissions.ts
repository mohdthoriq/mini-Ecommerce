import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Check jika izin penyimpanan sudah diberikan
 */
export const checkStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true; // iOS tidak perlu izin WRITE_EXTERNAL_STORAGE
  }

  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return granted;
  } catch (error) {
    console.error('Error checking storage permission:', error);
    return false;
  }
};

/**
 * Minta izin penyimpanan dengan custom message
 */
export const requestStoragePermission = async (
  title: string = 'Izin Penyimpanan',
  message: string = 'Aplikasi membutuhkan akses penyimpanan untuk menyimpan file.'
): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title,
        message,
        buttonPositive: 'Izinkan',
        buttonNegative: 'Tolak',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return false;
  }
};

/**
 * Minta multiple permissions sekaligus
 */
export const requestMultiplePermissions = async (): Promise<{
  storage: boolean;
  camera: boolean;
}> => {
  if (Platform.OS !== 'android') {
    return { storage: true, camera: true };
  }

  try {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);

    return {
      storage: grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED,
      camera: grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED,
    };
  } catch (error) {
    console.error('Error requesting multiple permissions:', error);
    return { storage: false, camera: false };
  }
};