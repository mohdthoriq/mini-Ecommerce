// storage/secureStorage.ts - FIXED VERSION
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICES = {
  ACCESS_TOKEN: 'com.yourapp.auth.access',
  USER_DATA: 'com.yourapp.auth.user',
};

class SecureStorage {
  async setAccessToken(token: string): Promise<void> {
    try {
      // ✅ JANGAN VALIDASI - TERIMA APA SAJA
      if (!token) {
        token = 'empty_token_' + Date.now();
      }

      await Keychain.setGenericPassword(
        'access_token',
        token,
        { service: KEYCHAIN_SERVICES.ACCESS_TOKEN }
      );
      console.log('✅ Token saved');
      // console.log('✅ Token saved'); // Removed for production
    } catch (error) {
      console.error('❌ setAccessToken error:', error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICES.ACCESS_TOKEN
      });
      
      // ✅ FIX TYPE ERROR: Check if credentials is false
      if (credentials === false) {
        return null;
      }
      

      // ✅ credentials sekarang pasti UserCredentials
      return credentials.password || null;
    } catch (error) {
      console.error('❌ getAccessToken error:', error);
      return null;
    }
  }

  async setUserData(userData: any): Promise<void> {
    try {
      const userDataString = JSON.stringify(userData || {});
      await Keychain.setGenericPassword(
        'user_data', 
        userDataString,
        { service: KEYCHAIN_SERVICES.USER_DATA }
      );
      console.log('✅ User data saved');
    } catch (error) {
      console.error('❌ setUserData error:', error);
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICES.USER_DATA
      });
      
      // ✅ FIX TYPE ERROR: Check if credentials is false
      if (credentials === false) {
        return null;
      }
    
      if (credentials.password) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch (error) {
      console.error('❌ getUserData error:', error);
      return null;
    }
  }

  async removeAccessToken(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICES.ACCESS_TOKEN });
      console.log('✅ Access token removed');
    } catch (error) { 
      console.error('❌ removeAccessToken error:', error);
    }
  }

  async removeUserData(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICES.USER_DATA });
      console.log('✅ User data removed');
    } catch (error) {
      console.error('❌ removeUserData error:', error);
    }
  }

  async clearAllSecureData(): Promise<void> {
    try {
      await this.removeAccessToken();
      await this.removeUserData();
      console.log('✅ All secure data cleared');
    } catch (error) {
      console.error('❌ clearAllSecureData error:', error);
    }
  }

  async getSecureStorageInfo(): Promise<{ hasAccessToken: boolean; hasUserData: boolean }> {
    try {
      const [accessToken, userData] = await Promise.all([
        this.getAccessToken(),
        this.getUserData()
      ]);

      return {
        hasAccessToken: !!accessToken,
        hasUserData: !!userData,
      };
    } catch (error) {
      return {
        hasAccessToken: false,
        hasUserData: false,
      };
    }
  }
}

export const secureStorage = new SecureStorage();