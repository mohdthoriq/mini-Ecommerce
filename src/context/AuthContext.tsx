// context/AuthContext.tsx - PERBAIKI DENGAN INTERFACE YANG LENGKAP
import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { secureStorage } from '../storage/secureStorage';
import authService,  { LoginCredentials } from '../storage/authService';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
}

interface AppSettings {
  theme: string;
  notificationsEnabled: boolean;
  language: string;
  isFirstLaunch: boolean;
}

// ✅ DEFINE AuthContextType DENGAN LENGKAP
interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  appSettings: AppSettings;
  authError: string | null;
  postLoginRedirect: { route: string; params?: any } | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: any) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => Promise<void>;
  getStorageInfo: () => Promise<{ hasAccessToken: boolean; hasUserData: boolean }>;
  clearAuthError: () => void;
  setPostLoginRedirect: (redirect: { route: string; params?: any } | null) => void;
  clearPostLoginRedirect: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// ✅ EXPORT useAuth SEBAGAI NAMED EXPORT
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ AuthProvider SEBAGAI DEFAULT EXPORT
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing app...');
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    notificationsEnabled: true,
    language: 'en',
    isFirstLaunch: true,
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [postLoginRedirect, setPostLoginRedirect] = useState<{ route: string; params?: any } | null>(null);

  // ✅ CHECK AUTH STATUS
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      setLoadingProgress(0);
      setLoadingMessage('Initializing app...');

      console.log('🔄 [AUTH] Starting session check...');

      // STEP 1: KEYCHAIN INITIALIZATION
      setLoadingProgress(20);
      setLoadingMessage('Checking secure storage...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // STEP 2: CHECK EXISTING SESSION
      setLoadingProgress(50);
      setLoadingMessage('Checking existing session...');
      const session = await authService.loadInitialAuthState();

      // STEP 3: FINALIZE
      setLoadingProgress(80);
      setLoadingMessage('Finalizing...');
      await new Promise(resolve => setTimeout(resolve, 200));

      if (session.isAuthenticated && session.user) {
        console.log('✅ [AUTH] Session valid. User authenticated:', session.user.name);
        setLoadingMessage('Welcome back!');
        setAuthState({
          isAuthenticated: true,
          user: session.user,
        });
      } else {
        console.log('ℹ️ [AUTH] No valid session found');
        setLoadingMessage('Ready to sign in');
        setAuthState({
          isAuthenticated: false,
          user: null,
        });
      }

      setLoadingProgress(100);

    } catch (error: unknown) { // ✅ TAMBAH TYPE UNTUK ERROR
      console.error('❌ Auth status check error:', error);
      setLoadingMessage('Loading failed, using default settings');
      setAuthError('Failed to initialize application');
      setAuthState({ isAuthenticated: false, user: null });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, []);

  // ✅ LOGIN FUNCTION - DENGAN ERROR TYPE
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      setLoadingMessage('Signing in...');

      console.log('🔐 [AUTH] Starting login process...');
      const authResponse = await authService.login(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user: authResponse.user,
      });

      console.log('✅ [AUTH] Login successful');

    } catch (error: unknown) { // ✅ TAMBAH TYPE UNTUK ERROR
      console.error('❌ Login error:', error);
      setAuthError('Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ LOGOUT FUNCTION - DENGAN ERROR TYPE
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setLoadingMessage('Signing out...');

      console.log('🚪 [AUTH] Starting logout...');
      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
      });

      console.log('✅ [AUTH] Logout completed');

    } catch (error: unknown) { // ✅ TAMBAH TYPE UNTUK ERROR
      console.error('❌ Logout error:', error);
      setAuthError('Logout failed');
      setAuthState({ isAuthenticated: false, user: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ CLEAR ALL DATA - DENGAN ERROR TYPE
  const clearAllData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      setAuthState({ isAuthenticated: false, user: null });
      setAppSettings({
        theme: 'light',
        notificationsEnabled: true,
        language: 'en',
        isFirstLaunch: false,
      });

      console.log('✅ [AUTH] All data cleared');

    } catch (error: unknown) { // ✅ TAMBAH TYPE UNTUK ERROR
      console.error('❌ Clear all data error:', error);
      setAuthError('Failed to clear data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (userData: any): void => {
    setAuthState(prev => {
      if (!prev.user) return prev;

      const updatedUser = { ...prev.user, ...userData };
      
      authService.updateUserData(updatedUser)
        .catch((error: unknown) => console.error('Profile update storage error:', error)); // ✅ TAMBAH TYPE

      return { ...prev, user: updatedUser };
    });
  };

  // ✅ UPDATE SETTINGS - DENGAN ERROR TYPE
  const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
    try {
      setAppSettings(prev => ({ ...prev, ...settings }));
      console.log('Settings updated:', settings);
    } catch (error: unknown) { // ✅ TAMBAH TYPE UNTUK ERROR
      console.error('Settings update error:', error);
      setAuthError('Failed to update settings');
      throw error;
    }
  };

  // ✅ GET STORAGE INFO - DENGAN ERROR TYPE
  const getStorageInfo = async (): Promise<{ hasAccessToken: boolean; hasUserData: boolean }> => {
    try {
      const info = await secureStorage.getSecureStorageInfo();
      return {
        hasAccessToken: info.hasAccessToken,
        hasUserData: info.hasUserData,
      };
    } catch (error: unknown) { // ✅ TAMBAH TYPE UNTUK ERROR
      console.error('Get storage info error:', error);
      return {
        hasAccessToken: false,
        hasUserData: false,
      };
    }
  };

  const clearAuthError = () => setAuthError(null);

  // ✅ INITIAL AUTH CHECK
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // ✅ CONTEXT VALUE
  const contextValue: AuthContextType = {
    // State
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading,
    loadingProgress,
    loadingMessage,
    appSettings,
    authError,
    postLoginRedirect,
    
    // Actions
    login,
    logout,
    updateProfile,
    updateSettings,
    clearAllData,
    getStorageInfo,
    clearAuthError,
    setPostLoginRedirect: (redirect) => {
      setPostLoginRedirect(redirect);
    },
    clearPostLoginRedirect: () => setPostLoginRedirect(null),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;