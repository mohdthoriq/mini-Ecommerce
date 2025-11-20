import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthData {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

class AuthService {
  private readonly AUTH_STORAGE_KEY = 'auth_data';

  async loadToken(): Promise<AuthData | null> {
    try {
      console.log('🔐 Loading auth token from storage...');
      
      const authData = await AsyncStorage.getItem(this.AUTH_STORAGE_KEY);
      
      if (authData) {
        const parsedData: AuthData = JSON.parse(authData);
        console.log('✅ Auth token loaded successfully');
        return parsedData;
      }
      
      console.log('ℹ️ No auth token found in storage');
      return null;
    } catch (error) {
      console.error('❌ Failed to load auth token:', error);
      throw new Error('AUTH_LOAD_FAILED');
    }
  }

  async saveToken(authData: AuthData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error('❌ Failed to save auth token:', error);
      throw error;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('❌ Failed to clear auth token:', error);
      throw error;
    }
  }
}

export default new AuthService();