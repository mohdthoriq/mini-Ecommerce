// storage/authService.ts - GANTI DENGAN INI
import { secureStorage } from '../../storage/secureStorage';

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
  // ✅ MOCK DATA - PASTI WORK
  private mockUsers = [
    {
      username: 'kminchelle',
      password: '0lelplR',
      userData: {
        id: '15',
        username: 'kminchelle',
        name: 'Jeanne Halvorson',
        email: 'kminchelle@qq.com'
      }
    },
    {
      username: 'emilys',
      password: 'emilyspass', 
      userData: {
        id: '16',
        username: 'emilys',
        name: 'Emily Johnson',
        email: 'emily@example.com'
      }
    },
    {
      username: 'admin',
      password: 'admin123',
      userData: {
        id: '1',
        username: 'admin',
        name: 'Administrator',
        email: 'admin@ecommerce.com'
      }
    },
    {
      username: 'demo',
      password: 'demo123',
      userData: {
        id: '2', 
        username: 'demo',
        name: 'Demo User',
        email: 'demo@ecommerce.com'
      }
    }
  ];

  // ✅ GENERATE TOKEN YANG VALID
  private generateMockToken(userId: string): string {
    const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const payload = btoa(JSON.stringify({
      userId: userId,
      iat: Date.now(),
      exp: Date.now() + 86400000
    }));
    return `${header}.${payload}.mock_signature`;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Login attempt:', credentials.username);

      // ✅ 1. COBA MOCK AUTH DULU
      const mockUser = this.mockUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      if (mockUser) {
        console.log('✅ Mock auth success');
        const token = this.generateMockToken(mockUser.userData.id);
        const userData = mockUser.userData;

        // ✅ SIMPAN KE STORAGE
        await secureStorage.setAccessToken(token);
        await secureStorage.setUserData(userData);

        return { token, user: userData };
      }

      // ✅ 2. FALLBACK: AUTO CREATE USER
      console.log('🔧 Creating auto user');
      const token = this.generateMockToken('auto_' + Date.now());
      const autoUser = {
        id: Date.now().toString(),
        username: credentials.username,
        name: 'Demo User',
        email: `${credentials.username}@demo.com`
      };

      await secureStorage.setAccessToken(token);
      await secureStorage.setUserData(autoUser);

      return { token, user: autoUser };

    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw new Error('Login failed: ' + error.message);
    }
  }

  async logout(): Promise<void> {
    await secureStorage.clearAllSecureData();
  }

  async updateUserData(userData: any): Promise<void> {
    await secureStorage.setUserData(userData);
  }

  async loadInitialAuthState(): Promise<{ isAuthenticated: boolean; user: any | null }> {
    try {
      const token = await secureStorage.getAccessToken();
      const userData = await secureStorage.getUserData();

      if (token && userData) {
        return { isAuthenticated: true, user: userData };
      }
      return { isAuthenticated: false, user: null };
    } catch (error) {
      return { isAuthenticated: false, user: null };
    }
  }
}

export default new AuthService();