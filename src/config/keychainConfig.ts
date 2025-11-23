import * as Keychain from 'react-native-keychain';

// ✅ DEFINISI YANG LEBIH SEDERHANA DAN AMAN
interface KeychainOptions {
  service: string;
  accessControl?: Keychain.ACCESS_CONTROL;
  accessible?: Keychain.ACCESSIBLE;
  authenticationType?: Keychain.AUTHENTICATION_TYPE;
  securityLevel?: Keychain.SECURITY_LEVEL;
  // HAPUS storage dan rules karena tidak ada di types
}

export const KEYCHAIN_OPTIONS = {
  // Untuk menyimpan credentials dengan biometrik
  BIOMETRIC_CREDENTIALS: {
    service: 'com.ecostore.biometric.credentials',
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
  } as KeychainOptions,
  
  // Untuk access token (tanpa biometrik)
  ACCESS_TOKEN: {
    service: 'com.ecostore.auth.token',
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  } as KeychainOptions,
  
  // Untuk user data
  USER_DATA: {
    service: 'com.ecostore.auth.user',
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  } as KeychainOptions,
};

export const BIOMETRIC_CONFIG = {
  promptMessage: 'Authenticate to login to Eco Store',
  cancelButtonText: 'Cancel',
  fallbackButtonText: 'Use Password',
  maxRetries: 3,
};