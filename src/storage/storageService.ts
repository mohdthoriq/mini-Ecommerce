// storageService.ts (FIXED VERSION)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './secureStorage'; // Import secure storage

/**
 * FIXED STORAGE SERVICE dengan security yang benar
 */
export const STORAGE_KEYS = {
  // ✅ NON-SENSITIVE data only
  USER_DATA: 'userData',           // User profile (non-sensitive parts)
  APP_THEME: 'appTheme',
  NOTIFICATION_STATUS: 'notificationStatus', 
  LANGUAGE: 'appLanguage',
  FIRST_LAUNCH: 'firstLaunch',
  USER_PREFERENCES: 'userPreferences',
  RECENT_SEARCHES: 'recentSearches',
  FAVORITE_PRODUCTS: 'favoriteProducts',
  CART_DATA: 'cartData',
  CART_BACKUP: 'cartBackup',
  PENDING_ORDERS: 'pendingOrders',
  DRAFT_DATA: 'draftData',
} as const;

// ✅ Hapus SENSITIVE_KEYS karena data sensitif sudah pindah ke secureStorage
export const CLEARABLE_KEYS = [
  STORAGE_KEYS.USER_DATA,
  STORAGE_KEYS.USER_PREFERENCES,
  STORAGE_KEYS.RECENT_SEARCHES,
  STORAGE_KEYS.FAVORITE_PRODUCTS,
  STORAGE_KEYS.CART_DATA,
  STORAGE_KEYS.CART_BACKUP,
  STORAGE_KEYS.PENDING_ORDERS,
  STORAGE_KEYS.DRAFT_DATA,
] as const;

export const PERSISTENT_KEYS = [
  STORAGE_KEYS.APP_THEME,
  STORAGE_KEYS.NOTIFICATION_STATUS,
  STORAGE_KEYS.LANGUAGE,
  STORAGE_KEYS.FIRST_LAUNCH,
] as const;

class StorageService {
  // MARK: - Secure Storage DELEGATION
  // Semua method secure storage di-delegate ke secureStorage.ts
  async setAccessToken(token: string): Promise<void> {
    return secureStorage.setAccessToken(token);
  }

  async getAccessToken(): Promise<string | null> {
    return secureStorage.getAccessToken();
  }

  async removeAccessToken(): Promise<void> {
    return secureStorage.clearAllSecureData();
  }

  async hasAccessToken(): Promise<boolean> {
    const token = await secureStorage.getAccessToken();
    return !!token;
  }

  // MARK: - AsyncStorage Operations (NON-SENSITIVE only)
  async setItem(key: string, value: any): Promise<void> {
    try {
      // ✅ Validasi: jangan simpan sensitive data di AsyncStorage
      if (this.isSensitiveKey(key)) {
        throw new Error(`Cannot store sensitive data '${key}' in AsyncStorage`);
      }

      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`AsyncStorage set error for key ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error(`AsyncStorage get error for key ${key}:`, error);
      return null;
    }
  }

  // ... method lainnya tetap sama TAPI tanpa sensitive data

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }
}

export const storageService = new StorageService();