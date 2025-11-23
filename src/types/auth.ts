import { User } from "./user";

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null
}

// ✅ TAMBAHKAN LoginCredentials
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginForm {
  username: string;
  email: string;
  password: string;
}

export interface ApiResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  loginMethod?: 'username' | 'email'; 
}

// ✅ TAMBAHKAN TYPE UNTUK BIOMETRIC
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
  requiresManualFallback?: boolean;
  requiresEnrollment?: boolean;
  errorCode?: string;
}

export interface BiometricAvailability {
  isAvailable: boolean;
  hasCredentials: boolean;
  isEnrolled?: boolean;
  error?: string;
  errorCode?: string;
  biometricType?: 'FaceID' | 'TouchID' | 'Biometrics' | 'Fingerprint' | null;
}

export interface StoredCredentials {
  username: string;
  password: string;
  timestamp: number;
}

export interface AppSettings {
  theme: string;
  notificationsEnabled: boolean;
  language: string;
  isFirstLaunch: boolean;
  biometricEnabled: boolean;
}

// ✅ UPDATE AuthContextType DENGAN BIOMETRIC
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
  securityLockout: boolean;
  lockoutTimeRemaining: number;
  biometryType?: 'FaceID' | 'TouchID' | 'Biometrics' | 'Fingerprint' | null;
  
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
  resetSecurityLockout: () => void;
  getSecurityStatus: () => {
    attemptCount: number;
    maxAttempts: number;
    isLocked: boolean;
    isPermanentlyLocked: boolean;
    timeRemaining: number;
    timeRemainingMinutes: number;
  };
  getBiometricPromptMessage: () => {
    title: string;
    subtitle: string;
    buttonText: string;
  };
}

// ✅ TAMBAHKAN TYPE UNTUK AUTH SERVICE
export interface AuthData {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    username?: string;
  };
}

export interface LoginResponse {
  token: string;
  user: AuthData['user'];
}