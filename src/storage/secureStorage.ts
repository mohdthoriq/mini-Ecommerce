import * as Keychain from 'react-native-keychain';

/**
 * SECURE STORAGE SERVICE
 * Khusus untuk data sensitif: tokens, credentials, biometric data
 * Kenapa dipisah: 
 * - Security focus yang ketat
 * - Tidak terkontaminasi dengan non-sensitive data
 * - Memudahkan audit security
 */

const KEYCHAIN_CONFIG = {
  service: 'com.ecom.securestore',
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

// Key names untuk different types of data
const SECURE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken', 
  BIOMETRIC_DATA: 'biometricData',
  ENCRYPTION_KEY: 'encryptionKey',
  SESSION_SECRET: 'sessionSecret',
} as const;

class SecureStorage {
  /**
   * SIMPAN ACCESS TOKEN
   * Token utama untuk API authorization
   */
  async setAccessToken(token: string): Promise<void> {
    try {
      if (!token || token.length < 10) {
        throw new Error('Invalid access token format');
      }

      const result = await Keychain.setGenericPassword(
        SECURE_KEYS.ACCESS_TOKEN,
        token,
        KEYCHAIN_CONFIG
      );

      if (!result) {
        throw new Error('Failed to save access token to secure storage');
      }

      console.log('✅ Access token saved to secure storage');
    } catch (error) {
      console.error('❌ SecureStorage setAccessToken error:', error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('Could not encrypt')) {
          throw new Error('SECURE_STORAGE_ENCRYPTION_FAILED');
        } else if (error.message.includes('Duplicate')) {
          throw new Error('TOKEN_ALREADY_EXISTS');
        }
      }
      
      throw new Error('ACCESS_TOKEN_SAVE_FAILED');
    }
  }

  /**
   * AMBIL ACCESS TOKEN
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword(KEYCHAIN_CONFIG);
      
      if (credentials && credentials.password) {
        // Validasi: cek apakah ini access token (bukan data lain)
        if (credentials.username === SECURE_KEYS.ACCESS_TOKEN) {
          if (credentials.password.length >= 10) {
            return credentials.password;
          } else {
            console.warn('⚠️ Invalid access token format found');
            await this.removeAccessToken();
            return null;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ SecureStorage getAccessToken error:', error);
      
      // Classify errors untuk handling yang tepat
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('user canceled') || errorMsg.includes('authentication failed')) {
          throw new Error('SECURE_STORAGE_ACCESS_DENIED');
        } else if (errorMsg.includes('keychain') && errorMsg.includes('not found')) {
          throw new Error('ACCESS_TOKEN_NOT_FOUND');
        } else if (errorMsg.includes('security') || errorMsg.includes('encryption')) {
          throw new Error('SECURE_STORAGE_CORRUPTED');
        }
      }
      
      throw new Error('ACCESS_TOKEN_RETRIEVAL_FAILED');
    }
  }

  /**
   * HAPUS ACCESS TOKEN
   */
  async removeAccessToken(): Promise<void> {
    try {
      // Approach 1: Reset dengan config spesifik
      await Keychain.resetGenericPassword(KEYCHAIN_CONFIG);
      
      // Approach 2: Reset generic untuk memastikan
      await Keychain.resetGenericPassword();
      
      console.log('✅ Access token removed from secure storage');
    } catch (error) {
      console.error('❌ SecureStorage removeAccessToken error:', error);
      throw new Error('ACCESS_TOKEN_REMOVAL_FAILED');
    }
  }

  /**
   * SIMPAN REFRESH TOKEN
   * Token untuk mendapatkan access token baru
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      if (!token || token.length < 10) {
        throw new Error('Invalid refresh token format');
      }

      // Simpan dengan username yang berbeda
      await Keychain.setGenericPassword(
        SECURE_KEYS.REFRESH_TOKEN,
        token,
        KEYCHAIN_CONFIG
      );

      console.log('✅ Refresh token saved to secure storage');
    } catch (error) {
      console.error('❌ SecureStorage setRefreshToken error:', error);
      throw new Error('REFRESH_TOKEN_SAVE_FAILED');
    }
  }

  /**
   * AMBIL REFRESH TOKEN
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword(KEYCHAIN_CONFIG);
      
      if (credentials && credentials.password && credentials.username === SECURE_KEYS.REFRESH_TOKEN) {
        if (credentials.password.length >= 10) {
          return credentials.password;
        } else {
          await this.removeRefreshToken();
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ SecureStorage getRefreshToken error:', error);
      throw new Error('REFRESH_TOKEN_RETRIEVAL_FAILED');
    }
  }

  /**
   * HAPUS REFRESH TOKEN
   */
  async removeRefreshToken(): Promise<void> {
    try {
      // Untuk menghapus specific item, kita reset semua
      // Karena Keychain tidak support delete by key
      await this.clearAllSecureData();
      console.log('✅ Refresh token removed');
    } catch (error) {
      console.error('❌ SecureStorage removeRefreshToken error:', error);
      throw new Error('REFRESH_TOKEN_REMOVAL_FAILED');
    }
  }

  /**
   * SIMPAN BIOMETRIC DATA
   * Untuk biometric authentication
   */
  async setBiometricData(data: string): Promise<void> {
    try {
      if (!data) {
        throw new Error('Invalid biometric data');
      }

      await Keychain.setGenericPassword(
        SECURE_KEYS.BIOMETRIC_DATA,
        data,
        {
          ...KEYCHAIN_CONFIG,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY, // Require biometric
        }
      );

      console.log('✅ Biometric data saved to secure storage');
    } catch (error) {
      console.error('❌ SecureStorage setBiometricData error:', error);
      throw new Error('BIOMETRIC_DATA_SAVE_FAILED');
    }
  }

  /**
   * AMBIL BIOMETRIC DATA
   * Akan trigger biometric prompt
   */
  async getBiometricData(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        ...KEYCHAIN_CONFIG,
        authenticationPrompt: {
          title: 'Authenticate to access app',
        },
      });
      
      if (credentials && credentials.password && credentials.username === SECURE_KEYS.BIOMETRIC_DATA) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      console.error('❌ SecureStorage getBiometricData error:', error);
      throw new Error('BIOMETRIC_DATA_RETRIEVAL_FAILED');
    }
  }

  /**
   * HAPUS BIOMETRIC DATA
   */
  async removeBiometricData(): Promise<void> {
    try {
      await this.clearAllSecureData();
      console.log('✅ Biometric data removed');
    } catch (error) {
      console.error('❌ SecureStorage removeBiometricData error:', error);
      throw new Error('BIOMETRIC_DATA_REMOVAL_FAILED');
    }
  }

  /**
   * CEK APAKAH ACCESS TOKEN ADA
   * tanpa mengambil value-nya (untuk performance)
   */
  async hasAccessToken(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch (error) {
      console.error('❌ SecureStorage hasAccessToken error:', error);
      return false;
    }
  }

  /**
   * CEK APAKAH REFRESH TOKEN ADA
   */
  async hasRefreshToken(): Promise<boolean> {
    try {
      const token = await this.getRefreshToken();
      return !!token;
    } catch (error) {
      console.error('❌ SecureStorage hasRefreshToken error:', error);
      return false;
    }
  }

  /**
   * VALIDASI KEYCHAIN ACCESS
   * Test apakah secure storage bisa diakses
   */
  async validateKeychainAccess(): Promise<boolean> {
    try {
      const testData = 'test_keychain_access_' + Date.now();
      
      // Test write
      await this.setAccessToken(testData);
      
      // Test read
      const retrieved = await this.getAccessToken();
      
      // Cleanup
      await this.removeAccessToken();
      
      const isValid = retrieved === testData;
      console.log('🔐 Keychain access validation:', isValid ? '✅ OK' : '❌ FAILED');
      
      return isValid;
    } catch (error) {
      console.error('❌ Keychain access validation failed:', error);
      return false;
    }
  }

  /**
   * HAPUS SEMUA DATA SENSITIVE
   * Untuk logout atau reset
   */
  async clearAllSecureData(): Promise<void> {
    try {
      console.log('🧹 Clearing all secure data...');
      
      // Multiple approaches untuk memastikan data terhapus
      await Promise.all([
        Keychain.resetGenericPassword(KEYCHAIN_CONFIG),
        Keychain.resetGenericPassword({ service: 'com.ecom.securestore' }),
        Keychain.resetGenericPassword() // Fallback
      ]);
      
      console.log('✅ All secure data cleared');
    } catch (error) {
      console.error('❌ SecureStorage clearAllSecureData error:', error);
      throw new Error('SECURE_DATA_CLEAR_FAILED');
    }
  }

  /**
   * GET SECURE STORAGE INFO
   * Untuk debugging dan monitoring
   */
  async getSecureStorageInfo(): Promise<{
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasBiometricData: boolean;
    keychainAccessible: boolean;
  }> {
    try {
      const [hasAccessToken, hasRefreshToken, hasBiometricData, keychainAccessible] = await Promise.all([
        this.hasAccessToken(),
        this.hasRefreshToken(),
        this.getBiometricData().then(data => !!data).catch(() => false),
        this.validateKeychainAccess()
      ]);

      return {
        hasAccessToken,
        hasRefreshToken,
        hasBiometricData,
        keychainAccessible,
      };
    } catch (error) {
      console.error('❌ SecureStorage getInfo error:', error);
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
        hasBiometricData: false,
        keychainAccessible: false,
      };
    }
  }

  /**
   * MIGRASI DARI LEGACY STORAGE
   * Pindahkan token dari AsyncStorage ke Secure Storage
   */
  async migrateFromLegacyStorage(asyncStorage: any): Promise<void> {
    try {
      console.log('🔄 Checking for legacy token migration...');
      
      // Cek apakah sudah ada token di secure storage
      const hasExistingToken = await this.hasAccessToken();
      if (hasExistingToken) {
        console.log('✅ Token already in secure storage, no migration needed');
        return;
      }

      // Cek token di legacy storage (AsyncStorage)
      const legacyToken = await asyncStorage.getItem('userToken');
      const legacyRefreshToken = await asyncStorage.getItem('refreshToken');

      if (legacyToken && legacyToken.length >= 10) {
        console.log('🔄 Migrating legacy tokens to secure storage...');
        
        // Migrate access token
        await this.setAccessToken(legacyToken);
        
        // Migrate refresh token jika ada
        if (legacyRefreshToken && legacyRefreshToken.length >= 10) {
          await this.setRefreshToken(legacyRefreshToken);
        }

        // Hapus dari legacy storage
        await asyncStorage.multiRemove(['userToken', 'refreshToken']);
        
        console.log('✅ Legacy tokens migrated to secure storage');
      } else {
        console.log('ℹ️ No legacy tokens found to migrate');
      }
    } catch (error) {
      console.error('❌ Token migration error:', error);
      throw new Error('TOKEN_MIGRATION_FAILED');
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Export types untuk error handling
export type SecureStorageError = 
  | 'ACCESS_TOKEN_SAVE_FAILED'
  | 'ACCESS_TOKEN_RETRIEVAL_FAILED' 
  | 'ACCESS_TOKEN_REMOVAL_FAILED'
  | 'REFRESH_TOKEN_SAVE_FAILED'
  | 'REFRESH_TOKEN_RETRIEVAL_FAILED'
  | 'REFRESH_TOKEN_REMOVAL_FAILED'
  | 'BIOMETRIC_DATA_SAVE_FAILED'
  | 'BIOMETRIC_DATA_RETRIEVAL_FAILED'
  | 'BIOMETRIC_DATA_REMOVAL_FAILED'
  | 'SECURE_STORAGE_ACCESS_DENIED'
  | 'SECURE_STORAGE_CORRUPTED'
  | 'SECURE_DATA_CLEAR_FAILED'
  | 'TOKEN_MIGRATION_FAILED';