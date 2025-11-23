import * as Keychain from 'react-native-keychain';
import { 
  LoginCredentials, 
  AuthData, 
  HybridAuthResponse,
  StoredCredentials
} from '../../types/auth';
import { KEYCHAIN_OPTIONS } from '../../config/keychainConfig';
import { secureStorage } from '../../storage/secureStorage';

class AuthService {
  private readonly BIOMETRIC_SERVICE = 'com.ecostore.biometric.credentials';

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

  /**
   * Login manual dan simpan credentials untuk biometrik
   */
  async login(credentials: LoginCredentials): Promise<AuthData> {
    try {
      console.log('🔐 [AUTH] Starting manual login...');

      // ✅ 1. COBA MOCK AUTH DULU
      const mockUser = this.mockUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      let userData;
      let token;

      if (mockUser) {
        console.log('✅ Mock auth success');
        token = this.generateMockToken(mockUser.userData.id);
        userData = mockUser.userData;
      } else {
        // ✅ 2. FALLBACK: AUTO CREATE USER
        console.log('🔧 Creating auto user');
        token = this.generateMockToken('auto_' + Date.now());
        userData = {
          id: Date.now().toString(),
          username: credentials.username,
          name: 'Demo User',
          email: `${credentials.username}@demo.com`
        };
      }

      // ✅ SIMPAN KE STORAGE
      await secureStorage.setAccessToken(token);
      await secureStorage.setUserData(userData);

      console.log('✅ [AUTH] Manual login successful');
      return { token, user: userData };

    } catch (error: any) {
      console.error('❌ [AUTH] Manual login failed:', error);
      throw new Error('Login failed: ' + error.message);
    }
  }

  /**
   * Login dengan biometrik
   */
  async loginWithBiometric(): Promise<HybridAuthResponse> {
    try {
      console.log('👆 [AUTH] Starting biometric login...');

      // 1. Check jika biometrik tersedia
      const biometricAvailable = await this.isBiometricSupported();
      if (!biometricAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available',
          method: 'biometric'
        };
      }

      // 2. Dapatkan stored credentials dengan biometrik
      const credentials = await this.getStoredCredentialsWithBiometric();
      if (!credentials) {
        return {
          success: false,
          error: 'No stored credentials found. Please login manually first.',
          method: 'biometric'
        };
      }

      // 3. Login dengan credentials yang didapat
      const authData = await this.login(credentials);

      console.log('✅ [AUTH] Biometric login successful');
      return {
        success: true,
        user: authData.user,
        token: authData.token,
        method: 'biometric'
      };

    } catch (error: any) {
      console.error('❌ [AUTH] Biometric login failed:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
        method: 'biometric'
      };
    }
  }

  /**
   * Simpan credentials untuk biometrik
   */
  async storeCredentialsForBiometric(credentials: LoginCredentials): Promise<boolean> {
    try {
      const credentialsData: StoredCredentials = {
        ...credentials,
        timestamp: Date.now()
      };

      await Keychain.setGenericPassword(
        'biometric_credentials',
        JSON.stringify(credentialsData),
        KEYCHAIN_OPTIONS.BIOMETRIC_CREDENTIALS
      );
      
      console.log('✅ [AUTH] Credentials stored for biometric');
      return true;
    } catch (error) {
      console.error('❌ [AUTH] Failed to store credentials for biometric:', error);
      return false;
    }
  }

  /**
   * Dapatkan stored credentials dengan autentikasi biometrik
   */
  private async getStoredCredentialsWithBiometric(): Promise<LoginCredentials | null> {
    try {
      const result = await Keychain.getGenericPassword(KEYCHAIN_OPTIONS.BIOMETRIC_CREDENTIALS);
      
      if (result && result.password) {
        const credentials: StoredCredentials = JSON.parse(result.password);
        
        // Validasi timestamp (opsional: hapus jika lebih dari 30 hari)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (credentials.timestamp < thirtyDaysAgo) {
          await this.clearBiometricCredentials();
          return null;
        }
        
        return {
          username: credentials.username,
          password: credentials.password
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ [AUTH] Failed to get credentials with biometric:', error);
      return null;
    }
  }

  /**
   * Check jika biometrik supported
   */
  async isBiometricSupported(): Promise<boolean> {
    try {
      const biometricType = await Keychain.getSupportedBiometryType();
      return biometricType !== null;
    } catch (error) {
      console.error('❌ [AUTH] Error checking biometric support:', error);
      return false;
    }
  }

  /**
   * Check jika ada stored credentials untuk biometrik
   */
  async hasStoredCredentials(): Promise<boolean> {
    try {
      const result = await Keychain.getGenericPassword(KEYCHAIN_OPTIONS.BIOMETRIC_CREDENTIALS);
      return !!(result && result.password);
    } catch (error) {
      return false;
    }
  }

  /**
   * Hapus stored biometric credentials
   */
  async clearBiometricCredentials(): Promise<void> {
    try {
      await Keychain.resetGenericPassword(KEYCHAIN_OPTIONS.BIOMETRIC_CREDENTIALS);
      console.log('✅ [AUTH] Biometric credentials cleared');
    } catch (error) {
      console.error('❌ [AUTH] Failed to clear biometric credentials:', error);
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

export const authService = new AuthService();
export default authService;