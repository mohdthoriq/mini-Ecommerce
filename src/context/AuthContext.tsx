import React, { createContext, useState, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthState['user'];
  login: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<AuthState['user']>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: undefined,
  login: async () => false,
  logout: () => { },
  updateProfile: () => { },
});

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
    user: undefined,
  });

  const login = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulasi login logic - ganti dengan API call sesungguhnya
      console.log('Attempting login with:', { username, email, password });
      
      // Demo login logic - selalu return true untuk demo
      if (email && password) {
        const userData = {
          id: '1',
          username: username || email.split('@')[0] || 'user', // Gunakan username jika ada, fallback ke email
          email: email,
          name: username || 'Demo User', // Gunakan username sebagai name
          avatar: undefined,
        };

        // Simpan ke state
        setAuthState({
          isAuthenticated: true,
          user: userData,
        });

        // Simpan ke AsyncStorage
        await AsyncStorage.setItem('userToken', 'demo-token-123');
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        console.log('Login successful, user:', userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      // Reset state
      setAuthState({
        isAuthenticated: false,
        user: undefined,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = (userData: Partial<AuthState['user']>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : undefined,
    }));
  };

  // Check existing auth status on app start
  React.useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');
        
        if (token && userDataString) {
          const userData = JSON.parse(userDataString);
          setAuthState({
            isAuthenticated: true,
            user: userData,
          });
          console.log('Auto-login successful, user:', userData);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();
  }, []);


   

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};