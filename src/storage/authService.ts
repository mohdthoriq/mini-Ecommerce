import { secureStorage } from './secureStorage';

/**
 * UPDATED AUTH SERVICE
 * Compatible dengan secureStorage yang baru
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

class AuthService {
async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
        console.log('🔐 [AUTH] Starting login with:', credentials);

        const response = await fetch('https://dummyjson.com/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        console.log('📡 [AUTH] Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📡 [AUTH] Response body:', responseText);

        if (!response.ok) {
            throw new Error(`LOGIN_FAILED: ${response.status} - ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('✅ [AUTH] Login successful, data received:', {
            hasToken: !!data.token,
            hasAccessToken: !!data.accessToken,
            allFields: Object.keys(data)
        });

        // Handle case where token might be in different field
        const accessToken = data.token || data.accessToken || `mock_token_${Date.now()}`;
        
        const authResponse: AuthResponse = {
            accessToken: accessToken,
            refreshToken: data.refreshToken || `refresh_${Date.now()}`,
            expiresIn: data.expiresIn || 3600 * 1000,
            user: {
                id: data.id.toString(),
                username: data.username,
                email: data.email,
                name: data.firstName && data.lastName 
                    ? `${data.firstName} ${data.lastName}`
                    : data.username,
                avatar: data.image,
            }
        };

        console.log('✅ [AUTH] Formatted auth response:', authResponse);
        return authResponse;

    } catch (error) {
        console.error('❌ [AUTH] Login error:', error);
        throw error;
    }
}

  async logout(): Promise<void> {
    try {
      await secureStorage.clearAllSecureData();
    } catch (error) {
      console.error('AuthService logout error:', error);
      throw error;
    }
  }

  async getCurrentAuthState(): Promise<{
    isAuthenticated: boolean;
    user: any | null;
    token: string | null;
  }> {
    try {
      const token = await secureStorage.getAccessToken();
      
      // Untuk sekarang, return basic state saja
      // User data bisa di-load dari API nanti jika needed
      return {
        isAuthenticated: !!token,
        user: null, // Bisa di-load dari API jika needed
        token
      };
    } catch (error) {
      console.error('AuthService getCurrentAuthState error:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null
      };
    }
  }

  async updateUserData(userData: any): Promise<void> {
    try {
      // Simpan user data - sementara skip dulu
      console.log('User data updated (storage pending):', userData);
    } catch (error) {
      console.error('AuthService updateUserData error:', error);
      throw error;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await secureStorage.getAccessToken();
      if (!token) return false;

      // TODO: Implement token validation logic
      // Bisa cek expiry, signature, dll.
      return true;
    } catch (error) {
      console.error('AuthService validateToken error:', error);
      return false;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) return null;

      // TODO: Implement refresh token logic
      // const newToken = await api.refreshToken(refreshToken);
      // await secureStorage.setAccessToken(newToken);
      // return newToken;

      return null;
    } catch (error) {
      console.error('AuthService refreshAccessToken error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();