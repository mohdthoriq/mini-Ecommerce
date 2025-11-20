import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { secureStorage } from '../storage/secureStorage';
import { authService, LoginCredentials } from '../storage/authService';

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

interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: AuthState['user'];
  loadingAuth: boolean;
  appSettings: AppSettings;
  authError: string | null;
  postLoginRedirect: { route: string; params?: any } | null;
  
  // Setters untuk hydration
  setUser: (user: any | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: (options?: { clearAll?: boolean; reason?: string }) => Promise<void>;
  updateProfile: (userData: Partial<AuthState['user']>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => Promise<void>;
  getStorageInfo: () => Promise<{ hasAccessToken: boolean; hasRefreshToken: boolean }>;
  clearAuthError: () => void;
  setPostLoginRedirect: (redirect: { route: string; params?: any } | null) => void;
  clearPostLoginRedirect: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

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
    user: null,
  });
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'light',
    notificationsEnabled: true,
    language: 'en',
    isFirstLaunch: true,
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [postLoginRedirect, setPostLoginRedirect] = useState<{ route: string; params?: any } | null>(null);

  // ✅ SETTERS UNTUK HYDRATION
  const handleSetUser = useCallback((user: any | null) => {
    console.log('👤 Setting user from hydration:', user ? 'User loaded' : 'No user');
    setAuthState(prev => ({ ...prev, user }));
  }, []);

  const handleSetToken = useCallback(async (token: string | null) => {
    console.log('🔐 Setting token from hydration:', token ? 'Token loaded' : 'No token');
    // Token akan dihandle oleh authService, kita cukup update auth state
    if (token) {
      setAuthState(prev => ({ ...prev, isAuthenticated: true }));
    } else {
      setAuthState(prev => ({ ...prev, isAuthenticated: false }));
    }
  }, []);

  const handleSetIsAuthenticated = useCallback((isAuthenticated: boolean) => {
    console.log('🔒 Setting auth state from hydration:', isAuthenticated);
    setAuthState(prev => ({ ...prev, isAuthenticated }));
  }, []);

  const clearAuthError = () => setAuthError(null);

  // Load initial data pada app startup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingAuth(true);
        setAuthError(null);

        // 1. Validasi Keychain access
        const isKeychainAccessible = await secureStorage.validateKeychainAccess();
        if (!isKeychainAccessible) {
          throw new Error('Keychain is not accessible');
        }

        // 2. Load auth state dari secure storage
        const authState = await authService.getCurrentAuthState();
        
        // 3. Set auth state
        setAuthState({
          isAuthenticated: authState.isAuthenticated,
          user: authState.user,
        });

        // 4. Load app settings (non-sensitive data)
        try {
          const theme = 'light';
          const notificationsEnabled = true;
          const language = 'en';
          const isFirstLaunch = true;

          setAppSettings({
            theme,
            notificationsEnabled,
            language,
            isFirstLaunch,
          });
        } catch (settingsError) {
          console.error('Settings load error:', settingsError);
        }

      } catch (error) {
        console.error('Initial data load error:', error);
        setAuthError('Failed to load application data');
        setAuthState({ isAuthenticated: false, user: null });
      } finally {
        setLoadingAuth(false);
      }
    };

    loadInitialData();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoadingAuth(true);
      setAuthError(null);

      const authResponse = await authService.login(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user: authResponse.user,
      });

    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Login failed. Please try again.');
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = async (options?: { clearAll?: boolean; reason?: string }): Promise<void> => {
    try {
      setLoadingAuth(true);
      setAuthError(null);

      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
      });

      console.log('✅ Logout completed:', options?.reason || 'user_initiated');

    } catch (error) {
      console.error('Logout error:', error);
      setAuthError('Logout failed');
      setAuthState({ isAuthenticated: false, user: null });
    } finally {
      setLoadingAuth(false);
    }
  };

  const clearAllData = async (): Promise<void> => {
    try {
      setLoadingAuth(true);
      await secureStorage.clearAllSecureData();
      
      setAuthState({ isAuthenticated: false, user: null });
      setAppSettings({
        theme: 'light',
        notificationsEnabled: true,
        language: 'en',
        isFirstLaunch: false,
      });

    } catch (error) {
      console.error('Clear all data error:', error);
      setAuthError('Failed to clear data');
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  };

  const updateProfile = (userData: Partial<AuthState['user']>): void => {
    setAuthState(prev => {
      if (!prev.user) return prev;

      const updatedUser = { ...prev.user, ...userData };
      
      authService.updateUserData(updatedUser)
        .catch(error => console.error('Profile update storage error:', error));

      return { ...prev, user: updatedUser };
    });
  };

  const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
    try {
      setAppSettings(prev => ({ ...prev, ...settings }));
      console.log('Settings updated (storage pending):', settings);
    } catch (error) {
      console.error('Settings update error:', error);
      setAuthError('Failed to update settings');
      throw error;
    }
  };

  const getStorageInfo = async (): Promise<{ hasAccessToken: boolean; hasRefreshToken: boolean }> => {
    try {
      const info = await secureStorage.getSecureStorageInfo();
      return {
        hasAccessToken: info.hasAccessToken,
        hasRefreshToken: info.hasRefreshToken,
      };
    } catch (error) {
      console.error('Get storage info error:', error);
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        // State
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        loadingAuth,
        appSettings,
        authError,
        postLoginRedirect,
        
        // Setters untuk hydration
        setUser: handleSetUser,
        setToken: handleSetToken,
        setIsAuthenticated: handleSetIsAuthenticated,
        
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};