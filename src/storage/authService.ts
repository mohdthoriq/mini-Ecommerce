// storage/authService.ts - TAMBAHKAN METHOD YANG MISSING
import { secureStorage } from './secureStorage';

export interface AuthData {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    username?: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthData['user'];
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting login with:', credentials.username);
      
      const response = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed: Invalid credentials');
      }

      const data = await response.json();
      console.log('✅ Login successful for user:', data.username);

      const minimalUserData = {
        id: data.id.toString(),
        username: data.username,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
      };

      await secureStorage.setAccessToken(data.token);
      await secureStorage.setUserData(minimalUserData);

      return {
        token: data.token,
        user: minimalUserData
      };

    } catch (error: unknown) {
      console.error('❌ Login service error:', error);
      throw error;
    }
  }

  // ✅ TAMBAHKAN METHOD logout YANG MISSING
  async logout(): Promise<void> {
    try {
      await secureStorage.clearAllSecureData();
      console.log('✅ Logout completed');
    } catch (error: unknown) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  // ✅ TAMBAHKAN METHOD updateUserData YANG MISSING
  async updateUserData(userData: any): Promise<void> {
    try {
      await secureStorage.setUserData(userData);
      console.log('✅ User data updated');
    } catch (error: unknown) {
      console.error('❌ Update user data error:', error);
      throw error;
    }
  }

  async loadInitialAuthState(): Promise<{ isAuthenticated: boolean; user: any | null }> {
    try {
      console.log('🔍 Checking for existing session...');
      
      const accessToken = await secureStorage.getAccessToken();
      
      console.log('📦 Session check - Access token:', !!accessToken);

      if (!accessToken) {
        console.log('ℹ️ No access token found');
        return { isAuthenticated: false, user: null };
      }

      const userData = await secureStorage.getUserData();
      console.log('📦 Session check - User data:', !!userData);

      if (userData) {
        console.log('✅ Session valid. User authenticated:', userData.name);
        return {
          isAuthenticated: true,
          user: userData
        };
      }

      console.log('⚠️ User data missing but access token exists');
      console.log('✅ Considering session valid (user data can be fetched later)');
      
      return {
        isAuthenticated: true,
        user: {
          id: 'temp',
          username: 'user',
          name: 'User',
          email: 'user@example.com'
        }
      };

    } catch (error: unknown) {
      console.error('❌ Session check error:', error);
      return { isAuthenticated: false, user: null };
    }
  }
}

export default new AuthService();