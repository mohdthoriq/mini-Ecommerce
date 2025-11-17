import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types';

export const STORAGE_KEYS = {
  // Authentication data
  USER_TOKEN: 'userToken',
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
  STORAGE_KEYS.USER_TOKEN,
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
  login: async () => {},
  logout: async () => {},
  updateProfile: () => {},
  updateSettings: () => {},
  clearAllData: async () => {},
  getStorageInfo: async () => ({ totalKeys: 0, sensitiveKeys: 0 }),
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

  // Load all critical data simultaneously on app start
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingAuth(true);
        console.time('MultiKeyLoad');

        // Load all critical data in parallel using multiGet
        const storageKeys = [
          STORAGE_KEYS.USER_TOKEN,
          STORAGE_KEYS.USER_DATA,
          STORAGE_KEYS.APP_THEME,
          STORAGE_KEYS.NOTIFICATION_STATUS,
          STORAGE_KEYS.LANGUAGE,
          STORAGE_KEYS.FIRST_LAUNCH,
        ];

        const results = await AsyncStorage.multiGet(storageKeys);
        
        // Convert array of key-value pairs to object for easier access
        const storageData = results.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, string | null>);

        console.log('📦 Multi-key load completed:', {
          keysLoaded: storageKeys.length,
          dataFound: Object.values(storageData).filter(Boolean).length
        });

        // Process authentication data
        const token = storageData[STORAGE_KEYS.USER_TOKEN];
        const userDataString = storageData[STORAGE_KEYS.USER_DATA];

        if (token && userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            setAuthState({
              isAuthenticated: true,
              user: userData,
            });
            console.log('✅ Auto-login successful');
          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
            await clearCorruptedData([STORAGE_KEYS.USER_DATA]);
          }
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
        console.error('❌ Error loading initial data:', error);
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

  // ✅ FUNGSI LOGOUT TERPUSAT YANG OPTIMIZED
  const logout = async (options?: { clearAll?: boolean; reason?: string }): Promise<void> => {
    try {
      setLoadingAuth(true);
      
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

      // Remove all sensitive data in one operation
      await AsyncStorage.multiRemove(keysToRemove);

      // Reset auth state
      setAuthState({
        isAuthenticated: false,
        user: undefined,
      });

      // Log the cleanup operation
      console.log('✅ Logout completed successfully:', {
        reason,
        keysRemoved: keysToRemove.length,
        previousStorage: storageInfo,
        clearAll
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Fallback: try individual removal if batch fails
      try {
        console.log('🔄 Attempting fallback cleanup...');
        for (const key of SENSITIVE_KEYS) {
          await AsyncStorage.removeItem(key).catch(e => 
            console.warn(`Failed to remove ${key}:`, e)
          );
        }
        
        setAuthState({
          isAuthenticated: false,
          user: undefined,
        });
        
        console.log('✅ Fallback cleanup completed');
      } catch (fallbackError) {
        console.error('❌ Fallback cleanup also failed:', fallbackError);
        throw new Error('Failed to complete logout process');
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  // ✅ CLEAR ALL DATA (Factory Reset)
  const clearAllData = async (): Promise<void> => {
    try {
      setLoadingAuth(true);
      console.log('🧹 Starting complete data cleanup...');

      // Get all keys first
      const allKeys = await AsyncStorage.getAllKeys();
      
      console.log('📊 Storage before cleanup:', {
        totalKeys: allKeys.length,
        keys: allKeys
      });

      // Remove everything
      await AsyncStorage.clear();

      // Reset all states
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

      console.log('✅ Complete data cleanup finished');

    } catch (error) {
      console.error('❌ Complete cleanup error:', error);
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

  const login = async (token: string, userData: AuthState['user']): Promise<void> => {
    try {
      setLoadingAuth(true);
      
      // Validate inputs
      if (!token || !userData) {
        throw new Error('Token and user data are required for login');
      }

      // Generate session data
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save to AsyncStorage using multiSet for better performance
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_TOKEN, token],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
        [STORAGE_KEYS.SESSION_ID, sessionId],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
      ]);

      // Update state
      setAuthState({
        isAuthenticated: true,
        user: userData,
      });

      console.log('✅ Login successful', { sessionId });

    } catch (error) {
      console.error('❌ Login error:', error);
      // Cleanup partial data if login fails
      await logout({ reason: 'login_failed' });
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  };

  const updateProfile = (userData: Partial<AuthState['user']>): void => {
    setAuthState(prev => {
      const updatedUser = prev.user ? { ...prev.user, ...userData } : undefined;
      
      // Update AsyncStorage
      if (updatedUser) {
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
          .then(() => console.log('✅ Profile updated in storage'))
          .catch(error => console.error('❌ Error updating profile:', error));
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
        const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        // If we have token but no user data (corrupted state), cleanup
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export helper functions for other parts of the app
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
  }
};