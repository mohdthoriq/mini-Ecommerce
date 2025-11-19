import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { Alert, Platform } from 'react-native';
import { AuthState } from '../types';

// Konfigurasi Keychain
const KEYCHAIN_CONFIG = {
  service: 'com.ecom.userToken', // Namespace spesifik untuk token
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, // Security level
} as const;

export const STORAGE_KEYS = {
  // Authentication data (token sekarang di Keychain)
  USER_TOKEN: 'userToken', // Hanya untuk referensi, tidak digunakan untuk storage
  USER_DATA: 'userData',
  SESSION_ID: 'sessionId',
  REFRESH_TOKEN: 'refreshToken',

  // App settings
  APP_THEME: 'appTheme',
  NOTIFICATION_STATUS: 'notificationStatus',
  LANGUAGE: 'appLanguage',
  FIRST_LAUNCH: 'firstLaunch',

  // User preferences
  USER_PREFERENCES: 'userPreferences',
  RECENT_SEARCHES: 'recentSearches',
  FAVORITE_PRODUCTS: 'favoriteProducts',

  // Cart data
  CART_DATA: 'cartData',
  CART_BACKUP: 'cartBackup',

  // Temporary data
  PENDING_ORDERS: 'pendingOrders',
  DRAFT_DATA: 'draftData',
} as const;

// Keys yang akan dihapus saat logout
export const SENSITIVE_KEYS = [
  STORAGE_KEYS.USER_TOKEN, // Tetap dalam daftar untuk cleanup legacy
  STORAGE_KEYS.USER_DATA,
  STORAGE_KEYS.SESSION_ID,
  STORAGE_KEYS.REFRESH_TOKEN,
  STORAGE_KEYS.USER_PREFERENCES,
  STORAGE_KEYS.RECENT_SEARCHES,
  STORAGE_KEYS.FAVORITE_PRODUCTS,
  STORAGE_KEYS.CART_DATA,
  STORAGE_KEYS.CART_BACKUP,
  STORAGE_KEYS.PENDING_ORDERS,
  STORAGE_KEYS.DRAFT_DATA,
] as const;

// Keys yang akan dipertahankan saat logout
export const PERSISTENT_KEYS = [
  STORAGE_KEYS.APP_THEME,
  STORAGE_KEYS.NOTIFICATION_STATUS,
  STORAGE_KEYS.LANGUAGE,
  STORAGE_KEYS.FIRST_LAUNCH,
] as const;

interface AppSettings {
  theme: string;
  notificationsEnabled: boolean;
  language: string;
  isFirstLaunch: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthState['user'];
  loadingAuth: boolean;
  appSettings: AppSettings;
  login: (token: string, userData: AuthState['user']) => Promise<void>;
  logout: (options?: { clearAll?: boolean; reason?: string }) => Promise<void>;
  updateProfile: (userData: Partial<AuthState['user']>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => Promise<void>;
  getStorageInfo: () => Promise<{ totalKeys: number; sensitiveKeys: number }>;
  // Tambahan method untuk keystore
  getStoredToken: () => Promise<string | null>;
  migrateLegacyToken: () => Promise<void>;
  // Error state
  authError: string | null;
  clearAuthError: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: undefined,
  loadingAuth: true,
  appSettings: {
    theme: 'light',
    notificationsEnabled: true,
    language: 'en',
    isFirstLaunch: true,
  },
  login: async () => { },
  logout: async () => { },
  updateProfile: () => { },
  updateSettings: () => { },
  clearAllData: async () => { },
  getStorageInfo: async () => ({ totalKeys: 0, sensitiveKeys: 0 }),
  getStoredToken: async () => null,
  migrateLegacyToken: async () => { },
  authError: null,
  clearAuthError: () => { },
});

interface AuthProviderProps {
  children: ReactNode;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions untuk Keychain dengan error handling yang lebih baik
const KeychainHelper = {
  // Simpan token ke Keychain
  async saveToken(token: string): Promise<void> {
    try {
      if (!token) {
        throw new Error('Token cannot be empty');
      }

      // Validasi panjang token untuk keamanan
      if (token.length < 10) {
        throw new Error('Invalid token format');
      }

      const result = await Keychain.setGenericPassword(
        'authToken', // username (required field)
        token,        // password (token kita)
        KEYCHAIN_CONFIG
      );

      if (!result) {
        throw new Error('Failed to save token to Keychain');
      }

      console.log('✅ Token saved to Keychain successfully');
    } catch (error) {
      console.error('❌ Error saving token to Keychain:', error);

      // Error spesifik untuk berbagai skenario
      let errorMessage = 'Failed to save authentication token';

      if (error instanceof Error) {
        if (error.message.includes('Could not encrypt') || error.message.includes('security')) {
          errorMessage = 'Security error: Unable to securely store token';
        } else if (error.message.includes('Duplicate')) {
          errorMessage = 'Token already exists in secure storage';
        }
      }

      throw new Error(errorMessage);
    }
  },

  // Ambil token dari Keychain dengan enhanced error handling
  async getToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword(KEYCHAIN_CONFIG);

      if (credentials) {
        // Validasi token yang diambil
        if (!credentials.password || credentials.password.length < 10) {
          console.warn('⚠️ Retrieved invalid token from Keychain');
          await this.deleteToken(); // Hapus token yang corrupt
          return null;
        }

        console.log('✅ Token retrieved from Keychain');
        return credentials.password;
      }

      console.log('ℹ️ No token found in Keychain');
      return null;
    } catch (error) {
      console.error('❌ Error retrieving token from Keychain:', error);

      // Klasifikasi error untuk penanganan yang lebih baik
      let errorMessage = 'Failed to retrieve authentication token';
      let shouldLogout = false;

      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();

        // Ini adalah error yang paling umum ketika PIN/Biometrik diubah.
        if (errorStr.includes('user canceled') || errorStr.includes('authentication failed') || errorStr.includes('keystore')) {
          errorMessage = 'Keamanan perangkat diubah, mohon login ulang.';
          shouldLogout = true;
        } else if (errorStr.includes('keychain') && errorStr.includes('not found')) {
          errorMessage = 'Session expired: Please log in again';
          shouldLogout = true;
        } else if (errorStr.includes('security') || errorStr.includes('encryption')) {
          // Ini adalah error yang lebih umum
          errorMessage = 'Gagal mengakses penyimpanan aman karena masalah keamanan.';
          shouldLogout = true;
        }
      }

      const enhancedError = new Error(errorMessage);
      (enhancedError as any).shouldLogout = shouldLogout;
      throw enhancedError;
    }
  },

  // Hapus token dari Keychain
  async deleteToken(): Promise<void> {
    try {
      console.log('🗑️ Attempting to delete token from Keychain...');

      // ⚠️ **Coba multiple approaches untuk memastikan token terhapus**

      // Approach 1: resetGenericPassword dengan config
      const result1 = await Keychain.resetGenericPassword(KEYCHAIN_CONFIG);

      // Approach 2: resetGenericPassword dengan service spesifik
      const result2 = await Keychain.resetGenericPassword({
        service: 'com.ecom.userToken'
      });

      if (result1 || result2) {
        console.log('✅ Token removed from Keychain');
      } else {
        console.log('ℹ️ No token to remove from Keychain');
      }
    } catch (error) {
      console.error('❌ Error removing token from Keychain:', error);

      // ⚠️ **Coba fallback approach**
      try {
        await Keychain.resetGenericPassword();
        console.log('✅ Fallback Keychain cleanup successful');
      } catch (fallbackError) {
        console.warn('⚠️ Fallback Keychain cleanup also failed:', fallbackError);
      }
    }
  },

  // Validasi konfigurasi Keychain
  async validateKeychainAccess(): Promise<boolean> {
    try {
      // Test write and read untuk validasi akses Keychain
      const testData = 'test_token_validation';
      await Keychain.setGenericPassword('test', testData, KEYCHAIN_CONFIG);
      const credentials = await Keychain.getGenericPassword(KEYCHAIN_CONFIG);
      await Keychain.resetGenericPassword(KEYCHAIN_CONFIG);

      if (credentials === false) return false

      return credentials.password === testData;

    } catch (error) {
      console.error('Keychain access validation failed:', error);
      return false;
    }
  },

  async hasToken(): Promise<boolean> {
    try {
      const creds = await Keychain.getGenericPassword(KEYCHAIN_CONFIG);
      return !!creds && !!creds.password;
    } catch (err) {
      console.error('❌ Failed checking hasToken:', err);
      return false;
    }
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: undefined,
  });
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    notificationsEnabled: true,
    language: 'en',
    isFirstLaunch: true,
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Fungsi untuk menampilkan alert kepada pengguna
  const showKeychainErrorAlert = (errorMessage: string, onAcknowledge?: () => void) => {
    Alert.alert('Akses Keamanan Gagal', errorMessage, [
      {
        text: 'OK',
        onPress: () => {
          console.log('User acknowledged Keychain error');
          onAcknowledge?.();
        },
      },
    ]);
  };

  // Fungsi untuk clear error
  const clearAuthError = () => setAuthError(null);

  // Fungsi untuk handle Keychain error secara konsisten
  const handleKeychainError = async (error: any, context: string) => {
    console.error(`❌ Keychain error in ${context}:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown Keychain error';
    const shouldLogout = error?.shouldLogout === true;

    // Set error state
    setAuthError(errorMessage);

    // Jika error ini mengharuskan logout (seperti access denied)
    if (shouldLogout) {
      // Tampilkan alert, dan setelah pengguna menekan "OK", proses logout akan berjalan.
      showKeychainErrorAlert(errorMessage);
      // Lakukan logout untuk membersihkan state dan token yang tidak valid.
      await logout({ reason: `keychain_error_${context}` });
    }
  };

  // Fungsi untuk migrasi token dari AsyncStorage ke Keychain
  const migrateLegacyToken = async (): Promise<void> => {
    try {
      console.log('🔄 Checking for legacy token migration...');

      // Cek apakah token sudah ada di Keychain
      const hasKeychainToken = await KeychainHelper.hasToken();

      if (hasKeychainToken) {
        console.log('✅ Token already in Keychain, no migration needed');
        return;
      }

      // Cek token di AsyncStorage (legacy)
      const legacyToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);

      if (legacyToken) {
        console.log('🔄 Migrating legacy token to Keychain...');

        // Validasi token sebelum migrasi
        if (legacyToken.length < 10) {
          console.warn('⚠️ Invalid legacy token format, skipping migration');
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
          return;
        }

        // Pindahkan token ke Keychain
        await KeychainHelper.saveToken(legacyToken);

        // Hapus token lama dari AsyncStorage
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);

        console.log('✅ Legacy token migrated successfully');
      } else {
        console.log('ℹ️ No legacy token found to migrate');
      }
    } catch (error) {
      console.error('❌ Error during token migration:', error);
      await handleKeychainError(error, 'migration');
    }
  };

  const asyncStorageKeys = [
    "userData",
    "appTheme",
    "notificationStatus",
    "appLanguage",
    "firstLaunch",
  ] as const;


  // Load all critical data simultaneously on app start dengan comprehensive error handling
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingAuth(true);
        setAuthError(null);
        console.time('MultiKeyLoad');

        // Validasi akses Keychain terlebih dahulu
        try {
          const isKeychainAccessible = await KeychainHelper.validateKeychainAccess();
          if (!isKeychainAccessible) {
            throw new Error('Keychain is not accessible on this device');
          }
        } catch (validationError) {
          console.error('❌ Keychain validation failed:', validationError);
          await handleKeychainError(validationError, 'validation');
          return;
        }

        // Jalankan migrasi token terlebih dahulu
        await migrateLegacyToken();

        let token: string | null = null;
        let asyncStorageResults: ReadonlyArray<[string, string | null]> = [];
        try {
          // Load data dari AsyncStorage dan Keychain secara parallel
          const asyncStorageKeys = [
            STORAGE_KEYS.USER_DATA,
            STORAGE_KEYS.APP_THEME,
            STORAGE_KEYS.NOTIFICATION_STATUS,
            STORAGE_KEYS.LANGUAGE,
            STORAGE_KEYS.FIRST_LAUNCH,
          ];

          [asyncStorageResults, token] = await Promise.all([
            AsyncStorage.multiGet(asyncStorageKeys),
            KeychainHelper.getToken(), // Ini bisa melempar error jika ada masalah akses Keychain
          ]);

        } catch (keychainError) {
          // Tangani error spesifik dari Keychain
          await handleKeychainError(keychainError, 'initial_load');
          // Tidak perlu return, biarkan finally dieksekusi
        }

        // Convert array of key-value pairs to object for easier access
        const storageData = asyncStorageResults.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string | null>);

        console.log('📦 Multi-key load completed:', {
          keysLoaded: asyncStorageKeys.length,
          dataFound: Object.values(storageData).filter(Boolean).length,
          hasToken: !!token
        });

        // Process authentication data
        const userDataString = storageData[STORAGE_KEYS.USER_DATA];

        if (token && userDataString) {
          try {
            const userData = JSON.parse(userDataString);

            // Validasi user data structure
            if (!userData.id || !userData.email) {
              throw new Error('Invalid user data structure');
            }

            setAuthState({
              isAuthenticated: true,
              user: userData,
            });
            console.log('✅ Auto-login successful with Keychain token');
          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
            await clearCorruptedData([STORAGE_KEYS.USER_DATA]);
            await logout({ reason: 'corrupted_user_data' });
          }
        } else if (token && !userDataString) {
          console.warn('⚠️ Token exists but user data is missing');
          // Token ada tapi user data tidak ada, consider sebagai corrupted state
          await logout({ reason: 'corrupted_user_data' });
        } else if (!token && userDataString) {
          console.warn('⚠️ User data exists but token is missing');
          // User data ada tapi token tidak ada, consider sebagai corrupted state
          await clearCorruptedData([STORAGE_KEYS.USER_DATA]);
        }

        // Process app settings
        const newSettings: AppSettings = {
          theme: storageData[STORAGE_KEYS.APP_THEME] || 'light',
          notificationsEnabled: storageData[STORAGE_KEYS.NOTIFICATION_STATUS] !== 'false',
          language: storageData[STORAGE_KEYS.LANGUAGE] || 'en',
          isFirstLaunch: storageData[STORAGE_KEYS.FIRST_LAUNCH] === null,
        };

        setAppSettings(newSettings);

        // Set first launch to false if it's the first time
        if (newSettings.isFirstLaunch) {
          await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
        }

        console.log('🎯 App settings loaded:', newSettings);

      } catch (error) {
        console.error('❌ General error loading initial data:', error);
        setAuthError('Failed to load application data');
        // Untuk error umum selain Keychain, tetap bersihkan state
        setAuthState({
          isAuthenticated: false,
          user: undefined,
        });
      } finally {
        console.timeEnd('MultiKeyLoad');
        setLoadingAuth(false);
      }
    };

    loadInitialData();
  }, []);

  // Clear specific corrupted data
  const clearCorruptedData = async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log('🧹 Cleared corrupted data:', keys);
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  };

  // ✅ FUNGSI LOGOUT TERPUSAT YANG OPTIMIZED (Dengan Keychain Support)
  const logout = async (options?: { clearAll?: boolean; reason?: string }): Promise<void> => {
    try {
      setLoadingAuth(true);
      setAuthError(null); // Clear error saat logout

      const { clearAll = false, reason = 'user_initiated' } = options || {};

      console.log(`🚪 Logout initiated: ${reason}`, { clearAll });

      // Determine which keys to remove
      const keysToRemove = clearAll
        ? [...SENSITIVE_KEYS, ...PERSISTENT_KEYS] // Hapus semua
        : SENSITIVE_KEYS; // Hapus hanya data sensitif

      // Get current storage info for logging
      const storageInfo = await getStorageInfo();

      console.log('🗑️ Removing keys:', {
        total: keysToRemove.length,
        sensitive: SENSITIVE_KEYS.length,
        persistent: PERSISTENT_KEYS.length,
        clearAll
      });

      // ⚠️ **URUTAN PENTING: Hapus data dari Keychain TERLEBIH DAHULU**
      console.log('1. Menghapus token dari Keychain...');
      await KeychainHelper.deleteToken();

      // ⚠️ **Tambahan: Panggil resetGenericPassword langsung untuk memastikan**
      try {
        await Keychain.resetGenericPassword({
          service: 'com.ecom.userToken' // Service yang spesifik
        });
        console.log('✅ Token dihapus dari Keychain dengan service spesifik');
      } catch (keychainError) {
        console.warn('⚠️ Fallback Keychain cleanup:', keychainError);
      }

      // ⚠️ **Kemudian hapus data dari AsyncStorage**
      console.log('2. Menghapus data sensitif dari AsyncStorage...');
      await AsyncStorage.multiRemove(keysToRemove);

      // ⚠️ **Reset auth state SETELAH data dibersihkan**
      console.log('3. Reset auth state...');
      setAuthState({
        isAuthenticated: false,
        user: undefined,
      });

      // Log the cleanup operation
      console.log('✅ Logout completed successfully:', {
        reason,
        keysRemoved: keysToRemove.length,
        previousStorage: storageInfo,
        clearAll,
        keychainCleared: true
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      setAuthError('Failed to complete logout');

      // Fallback: try individual removal if batch fails
      try {
        console.log('🔄 Attempting fallback cleanup...');

        // ⚠️ **Fallback 1: Hapus token dari Keychain**
        await KeychainHelper.deleteToken().catch(e =>
          console.warn('Failed to remove token from Keychain:', e)
        );

        // ⚠️ **Fallback 2: Reset Keychain dengan service spesifik**
        try {
          await Keychain.resetGenericPassword({
            service: 'com.ecom.userToken'
          });
        } catch (keychainError) {
          console.warn('Fallback Keychain reset failed:', keychainError);
        }

        // ⚠️ **Fallback 3: Hapus data dari AsyncStorage satu per satu**
        for (const key of SENSITIVE_KEYS) {
          await AsyncStorage.removeItem(key).catch(e =>
            console.warn(`Failed to remove ${key}:`, e)
          );
        }

        // ⚠️ **Reset state setelah fallback cleanup**
        setAuthState({
          isAuthenticated: false,
          user: undefined,
        });

        console.log('✅ Fallback cleanup completed');

      } catch (fallbackError) {
        console.error('❌ Fallback cleanup also failed:', fallbackError);
        setAuthError('Critical error during logout');

        // ⚠️ **Even if everything fails, ensure auth state is reset**
        setAuthState({
          isAuthenticated: false,
          user: undefined,
        });

        throw new Error('Failed to complete logout process');
      }
    } finally {
      setLoadingAuth(false);
    }
  };


  const clearAllData = async (): Promise<void> => {
    try {
      setLoadingAuth(true);
      setAuthError(null);
      console.log('🧹 Starting complete data cleanup...');

      // ⚠️ **URUTAN PENTING: Hapus dari Keychain terlebih dahulu**
      console.log('1. Menghapus token dari Keychain...');
      await KeychainHelper.deleteToken();

      // ⚠️ **Tambahan reset dengan service spesifik**
      try {
        await Keychain.resetGenericPassword({
          service: 'com.ecom.userToken'
        });
        console.log('✅ Keychain reset dengan service spesifik');
      } catch (keychainError) {
        console.warn('⚠️ Additional Keychain cleanup:', keychainError);
      }

      // ⚠️ **Kemudian hapus semua dari AsyncStorage**
      console.log('2. Menghapus semua data dari AsyncStorage...');

      // Get all keys first untuk logging
      const allKeys = await AsyncStorage.getAllKeys();

      console.log('📊 Storage before cleanup:', {
        totalKeys: allKeys.length,
        keys: allKeys
      });

      // Remove everything dari AsyncStorage
      await AsyncStorage.clear();

      // ⚠️ **Reset state SETELAH data dibersihkan**
      console.log('3. Reset semua state...');
      setAuthState({
        isAuthenticated: false,
        user: undefined,
      });

      setAppSettings({
        theme: 'light',
        notificationsEnabled: true,
        language: 'en',
        isFirstLaunch: false, // Set to false since user has used the app
      });

      console.log('✅ Complete data cleanup finished (Keychain + AsyncStorage)');

    } catch (error) {
      console.error('❌ Complete cleanup error:', error);
      setAuthError('Failed to clear all data');

      // ⚠️ **Even if cleanup fails, ensure state is reset**
      setAuthState({
        isAuthenticated: false,
        user: undefined,
      });

      throw error;
    } finally {
      setLoadingAuth(false);
    }
  };

  // ✅ GET STORAGE INFORMATION
  const getStorageInfo = async (): Promise<{ totalKeys: number; sensitiveKeys: number }> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sensitiveKeysCount = allKeys.filter(key =>
        SENSITIVE_KEYS.includes(key as any)
      ).length;

      return {
        totalKeys: allKeys.length,
        sensitiveKeys: sensitiveKeysCount,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalKeys: 0, sensitiveKeys: 0 };
    }
  };

  // ✅ FUNGSI LOGIN YANG MENGGUNAKAN KEYCHAIN dengan error handling
  const login = async (token: string, userData: AuthState['user']): Promise<void> => {
    try {
      setLoadingAuth(true);
      setAuthError(null);

      // Validate inputs
      if (!token || !userData) {
        throw new Error('Token and user data are required for login');
      }

      // Validasi token
      if (token.length < 10) {
        throw new Error('Invalid token format');
      }

      // Validasi user data
      if (!userData.id || !userData.email) {
        throw new Error('Invalid user data structure');
      }

      // Generate session data
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simpan token ke Keychain dan data lainnya ke AsyncStorage secara parallel
      await Promise.all([
        KeychainHelper.saveToken(token), // Simpan token ke Keychain
        AsyncStorage.multiSet([
          [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
          [STORAGE_KEYS.SESSION_ID, sessionId],
          [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        ])
      ]);

      // Update state
      setAuthState({
        isAuthenticated: true,
        user: userData,
      });

      console.log('✅ Login successful', {
        sessionId,
        tokenStoredIn: 'Keychain',
        userId: userData.id
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      setAuthError('Failed to complete login');

      // Cleanup partial data if login fails
      await KeychainHelper.deleteToken().catch(e =>
        console.warn('Failed to cleanup token during login error:', e)
      );
      await logout({ reason: 'login_failed' });
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  };

  // ✅ GET STORED TOKEN (Utility function untuk komponen lain)
  const getStoredToken = async (): Promise<string | null> => {
    try {
      return await KeychainHelper.getToken();
    } catch (error) {
      await handleKeychainError(error, 'get_stored_token');
      return null;
    }
  };

  const updateProfile = (userData: Partial<AuthState['user']>): void => {
    setAuthState(prev => {
      const updatedUser = prev.user ? { ...prev.user, ...userData } : undefined;

      // Update AsyncStorage
      if (updatedUser) {
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
          .then(() => console.log('✅ Profile updated in storage'))
          .catch(error => {
            console.error('❌ Error updating profile:', error);
            setAuthError('Failed to update profile');
          });
      }

      return {
        ...prev,
        user: updatedUser,
      };
    });
  };

  const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
    try {
      setAppSettings(prev => ({ ...prev, ...settings }));

      // Prepare batch storage updates
      const updates: [string, string][] = [];

      if (settings.theme !== undefined) {
        updates.push([STORAGE_KEYS.APP_THEME, settings.theme]);
      }

      if (settings.notificationsEnabled !== undefined) {
        updates.push([STORAGE_KEYS.NOTIFICATION_STATUS, settings.notificationsEnabled.toString()]);
      }

      if (settings.language !== undefined) {
        updates.push([STORAGE_KEYS.LANGUAGE, settings.language]);
      }

      // Execute batch update if there are changes
      if (updates.length > 0) {
        await AsyncStorage.multiSet(updates);
        console.log('✅ Settings updated:', settings);
      }

    } catch (error) {
      console.error('❌ Error updating settings:', error);
      setAuthError('Failed to update settings');
      throw error;
    }
  };

  // Optional: Preload additional data after initial load
  useEffect(() => {
    if (!loadingAuth && authState.isAuthenticated) {
      preloadAdditionalData();
    }
  }, [loadingAuth, authState.isAuthenticated]);

  const preloadAdditionalData = async () => {
    try {
      // Preload other non-critical data that might be needed soon
      const additionalKeys = [
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.RECENT_SEARCHES,
        STORAGE_KEYS.FAVORITE_PRODUCTS,
      ];

      await AsyncStorage.multiGet(additionalKeys);
      console.log('📦 Additional data preloaded');
    } catch (error) {
      console.error('Preload error:', error);
    }
  };

  // Auto-cleanup on app start (optional)
  useEffect(() => {
    const checkAndCleanup = async () => {
      try {
        const token = await KeychainHelper.getToken();
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

        // Jika ada token tapi tidak ada user data (corrupted state), cleanup
        if (token && !userData) {
          console.warn('🔄 Detected corrupted auth state, cleaning up...');
          await logout({ reason: 'corrupted_data' });
        }
      } catch (error) {
        console.error('Auto-cleanup check failed:', error);
      }
    };

    checkAndCleanup();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        loadingAuth,
        appSettings,
        login,
        logout,
        updateProfile,
        updateSettings,
        clearAllData,
        getStorageInfo,
        getStoredToken,
        migrateLegacyToken,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export helper functions untuk bagian lain aplikasi
export const storageHelper = {
  // Bulk save multiple items
  async multiSet(items: Record<string, any>): Promise<void> {
    try {
      const entries = Object.entries(items).map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value)
      ]) as [string, string][];

      await AsyncStorage.multiSet(entries);
    } catch (error) {
      console.error('Multi-set error:', error);
      throw error;
    }
  },

  // Bulk load multiple items
  async multiGet(keys: string[]): Promise<Record<string, any>> {
    try {
      const results = await AsyncStorage.multiGet(keys);
      return results.reduce((acc, [key, value]) => {
        if (value !== null) {
          try {
            acc[key] = JSON.parse(value);
          } catch {
            acc[key] = value; // Return as string if not JSON
          }
        }
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.error('Multi-get error:', error);
      throw error;
    }
  },

  // Clear multiple items
  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Multi-remove error:', error);
      throw error;
    }
  },

  // Get storage statistics
  async getStorageStats(): Promise<{ totalSize: number; keyCount: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const multiResult = await AsyncStorage.multiGet(keys);

      const totalSize = multiResult.reduce((size, [_, value]) => {
        return size + (value ? value.length : 0);
      }, 0);

      return {
        totalSize,
        keyCount: keys.length,
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      return { totalSize: 0, keyCount: 0 };
    }
  },

  // Keychain helper functions
  keychain: KeychainHelper
};