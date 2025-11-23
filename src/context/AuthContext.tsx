// context/AuthContext.tsx - PASTIKAN SEMUA PROPERTIES DIEKSPOR
import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { secureStorage } from '../storage/secureStorage';
import authService from '../storage/authService';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import {
    AuthState,
    LoginCredentials,
    AppSettings,
    AuthContextType,
    HybridAuthResponse,
} from '../types/auth';
import { User } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

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
        biometricEnabled: false,
    });
    const [authError, setAuthError] = useState<string | null>(null);
    const [postLoginRedirect, setPostLoginRedirect] = useState<{ route: string; params?: any } | null>(null);

    // ✅ INTEGRASI BIOMETRIC HOOK DENGAN SEMUA PROPERTIES
    const {
        biometricLogin,
        checkBiometricAvailability,
        enableBiometric,
        disableBiometric,
        isBiometricLoading,
        showNotEnrolledAlert,
        // ✅ AMBIL SEMUA PROPERTIES DARI HOOK
        securityLockout,
        lockoutTimeRemaining,
        resetSecurityLockout,
        getSecurityStatus,
        biometryType,
        getBiometricPromptMessage
    } = useBiometricAuth();

    // ✅ CHECK AUTH STATUS + BIOMETRIC AVAILABILITY
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

            const safeUser: User | null = session.user ?? null;

            // STEP 3: CHECK BIOMETRIC AVAILABILITY
            setLoadingProgress(70);
            setLoadingMessage('Checking biometric settings...');
            const biometricAvailability = await checkBiometricAvailability();

            setAppSettings(prev => ({
                ...prev,
                biometricEnabled: biometricAvailability.isAvailable && biometricAvailability.hasCredentials
            }));

            // STEP 4: FINALIZE
            setLoadingProgress(90);
            setLoadingMessage('Finalizing...');
            await new Promise(resolve => setTimeout(resolve, 200));

            if (session.isAuthenticated && safeUser) {
                console.log('✅ [AUTH] Session valid. User authenticated:', safeUser.name);
                setLoadingMessage('Welcome back!');
                setAuthState({
                    isAuthenticated: true,
                    user: safeUser,
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

        } catch (error: any) {
            console.error('❌ Auth status check error:', error);
            setLoadingMessage('Loading failed, using default settings');
            setAuthError('Failed to initialize application');
            setAuthState({
                isAuthenticated: false,
                user: null
            });
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }
    }, [checkBiometricAvailability]);

    // ✅ LOGIN FUNCTION
    const login = async (credentials: LoginCredentials): Promise<void> => {
        try {
            setIsLoading(true);
            setAuthError(null);
            setLoadingMessage('Signing in...');

            console.log('🔐 [AUTH] Starting login process...');
            const authResponse = await authService.login(credentials);

            const userData: User | null = authResponse.user ?? null;

            setAuthState({
                isAuthenticated: true,
                user: userData,
            });

            console.log('✅ [AUTH] Login successful');

        } catch (error: any) {
            console.error('❌ Login error:', error);
            setAuthError('Login failed. Please try again.');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ BIOMETRIC LOGIN FUNCTION
    const handleBiometricLogin = async (): Promise<HybridAuthResponse> => {
        try {
            setIsLoading(true);
            setAuthError(null);
            setLoadingMessage('Authenticating with biometric...');

            const result = await biometricLogin();
            
            if (result.success) {
                const userData: User | null = result.user ?? null;
                
                setAuthState({
                    isAuthenticated: true,
                    user: userData,
                });
                console.log('✅ [AUTH] Biometric login successful');
            } else {
                if (result.requiresEnrollment) {
                    showNotEnrolledAlert(() => {
                        // Fallback ke manual login
                    });
                } else if (result.requiresManualFallback) {
                    setAuthError(result.error || 'Biometric login failed');
                }
                if (!result.error?.includes('cancel')) {
                    setAuthError(result.error || 'Biometric authentication failed');
                }
            }

            return result;

        } catch (error: any) {
            console.error('❌ [AUTH] Biometric login error:', error);
            const errorResponse: HybridAuthResponse = {
                success: false,
                error: error.message || 'Biometric authentication failed',
                method: 'biometric',
                requiresManualFallback: true
            };
            setAuthError(error.message || 'Biometric authentication failed');
            return errorResponse;
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ ENABLE BIOMETRIC FUNCTION
    const handleEnableBiometric = async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            console.log('👆 [AUTH] Enabling biometric authentication...');
            
            const result = await enableBiometric(credentials);

            if (result.success) {
                setAppSettings(prev => ({ ...prev, biometricEnabled: true }));
                Alert.alert(
                    'Biometric Enabled',
                    'You can now login with Face ID / Fingerprint',
                    [{ text: 'OK' }]
                );
                return true;
            } else {
                if (result.requiresEnrollment) {
                    showNotEnrolledAlert();
                } else {
                    Alert.alert(
                        'Biometric Setup Failed',
                        result.error || 'Failed to enable biometric authentication',
                        [{ text: 'OK' }]
                    );
                }
                return false;
            }
        } catch (error: any) {
            console.error('❌ [AUTH] Failed to enable biometric:', error);
            Alert.alert(
                'Biometric Setup Failed',
                error.message || 'Failed to enable biometric authentication',
                [{ text: 'OK' }]
            );
            return false;
        }
    };

    // ✅ DISABLE BIOMETRIC FUNCTION
    const handleDisableBiometric = async (): Promise<void> => {
        try {
            console.log('👆 [AUTH] Disabling biometric authentication...');
            await disableBiometric();
            setAppSettings(prev => ({ ...prev, biometricEnabled: false }));
            
            Alert.alert(
                'Biometric Disabled',
                'Biometric authentication has been disabled',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('❌ [AUTH] Failed to disable biometric:', error);
            Alert.alert(
                'Error',
                'Failed to disable biometric authentication',
                [{ text: 'OK' }]
            );
            throw error;
        }
    };

    // ✅ CHECK BIOMETRIC AVAILABILITY
    const isBiometricAvailable = async (): Promise<boolean> => {
        const availability = await checkBiometricAvailability();
        return availability.isAvailable && availability.hasCredentials;
    };

    // ✅ LOGOUT FUNCTION
    const logout = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setLoadingMessage('Signing out...');

            console.log('🚪 [AUTH] Starting logout...');
            await authService.logout();

            setAppSettings(prev => ({ ...prev, biometricEnabled: false }));

            setAuthState({
                isAuthenticated: false,
                user: null,
            });

            console.log('✅ [AUTH] Logout completed');

        } catch (error: any) {
            console.error('❌ Logout error:', error);
            setAuthError('Logout failed');
            setAuthState({
                isAuthenticated: false,
                user: null
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ✅ CLEAR ALL DATA FUNCTION
    const clearAllData = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await authService.logout();
            
            try {
                await disableBiometric();
            } catch (error) {
                console.warn('Failed to clear biometric credentials:', error);
            }

            setAuthState({
                isAuthenticated: false,
                user: null
            });
            setAppSettings({
                theme: 'light',
                notificationsEnabled: true,
                language: 'en',
                isFirstLaunch: false,
                biometricEnabled: false,
            });

            console.log('✅ [AUTH] All data cleared');

        } catch (error: any) {
            console.error('❌ Clear all data error:', error);
            setAuthError('Failed to clear data');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ UPDATE PROFILE FUNCTION
    const updateProfile = (userData: Partial<User>): void => {
        setAuthState(prev => {
            if (!prev.user) {
                console.warn('⚠️ [AUTH] Cannot update profile: no user data');
                return prev;
            }

            const updatedUser = { ...prev.user, ...userData };

            authService.updateUserData(updatedUser)
                .catch((error: any) => console.error('Profile update storage error:', error));

            return { ...prev, user: updatedUser };
        });
    };

    // ✅ UPDATE SETTINGS FUNCTION
    const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
        try {
            setAppSettings(prev => ({ ...prev, ...settings }));
            console.log('Settings updated:', settings);
        } catch (error: any) {
            console.error('Settings update error:', error);
            setAuthError('Failed to update settings');
            throw error;
        }
    };

    // ✅ GET STORAGE INFO FUNCTION
    const getStorageInfo = async (): Promise<{ hasAccessToken: boolean; hasUserData: boolean }> => {
        try {
            const info = await secureStorage.getSecureStorageInfo();
            return {
                hasAccessToken: info.hasAccessToken,
                hasUserData: info.hasUserData,
            };
        } catch (error: any) {
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

    // ✅ CONTEXT VALUE - PASTIKAN SEMUA PROPERTY SESUAI INTERFACE
    const contextValue: AuthContextType = {
        // State
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        isLoading: isLoading || isBiometricLoading,
        loadingProgress,
        loadingMessage,
        appSettings,
        authError,
        postLoginRedirect,
        
        // ✅ TAMBAHKAN SECURITY STATE & BIOMETRIC TYPE
        securityLockout,
        lockoutTimeRemaining,
        biometryType,

        // Actions
        login,
        logout,
        biometricLogin: handleBiometricLogin,
        isBiometricAvailable,
        enableBiometric: handleEnableBiometric,
        disableBiometric: handleDisableBiometric,
        updateProfile,
        updateSettings,
        clearAllData,
        getStorageInfo,
        clearAuthError,
        setPostLoginRedirect: (redirect) => {
            setPostLoginRedirect(redirect);
        },
        clearPostLoginRedirect: () => setPostLoginRedirect(null),
        
        // ✅ TAMBAHKAN SEMUA SECURITY METHODS
        resetSecurityLockout,
        getSecurityStatus,
        
        // ✅ TAMBAHKAN BIOMETRIC PROMPT METHOD
        getBiometricPromptMessage,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;