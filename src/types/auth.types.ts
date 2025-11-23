import { LoginCredentials } from '../storage/authservice';
import { User } from './user';

// Tambahkan type definitions untuk integrasi biometrik
export interface BiometricAuthConfig {
  enabled: boolean;
  promptMessage?: string;
  cancelButtonText?: string;
}

export interface HybridAuthResponse {
  success: boolean;
  user?: User | null;
  token?: string;
  error?: string;
  method: 'biometric' | 'manual';
}

export interface StoredCredentials {
  username: string;
  password: string;
  timestamp: number;
}

// Update AuthContextType dengan method biometrik
export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  appSettings: AppSettings;
  authError: string | null;
  postLoginRedirect: { route: string; params?: any } | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  biometricLogin: () => Promise<HybridAuthResponse>;
  isBiometricAvailable: () => Promise<boolean>;
  enableBiometric: (credentials: LoginCredentials) => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  updateProfile: (userData: any) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => Promise<void>;
  getStorageInfo: () => Promise<{ hasAccessToken: boolean; hasUserData: boolean }>;
  clearAuthError: () => void;
  setPostLoginRedirect: (redirect: { route: string; params?: any } | null) => void;
  clearPostLoginRedirect: () => void;
}

export interface AppSettings {
  theme: string;
  notificationsEnabled: boolean;
  language: string;
  isFirstLaunch: boolean;
  biometricEnabled: boolean;
}