// hooks/useBiometricAuth.ts - WITH BIOMETRIC TYPE DETECTION
import { useState, useCallback, useRef } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { authService } from '../services/auth/authService';
import { HybridAuthResponse, LoginCredentials, BiometricAvailability } from '../types/auth';
import { NavigationService } from '../services/navigation/NavigationService';

// ✅ SECURITY CONFIG
const SECURITY_CONFIG = {
  MAX_ATTEMPTS: 3,
  LOCKOUT_DURATION: 5 * 60 * 1000,
  PERMANENT_LOCKOUT_AFTER: 10
};

export const useBiometricAuth = () => {
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [securityLockout, setSecurityLockout] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);
  const [biometryType, setBiometryType] = useState<'FaceID' | 'TouchID' | 'Biometrics' | 'Fingerprint' | null>(null);
  
  // ✅ REF UNTUK TRACK ATTEMPTS
  const attemptCountRef = useRef(0);
  const permanentLockoutRef = useRef(false);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * ✅ DETEKSI TIPE BIOMETRIK YANG TERSEDIA
   */
  const detectBiometryType = useCallback(async (): Promise<'FaceID' | 'TouchID' | 'Biometrics' | 'Fingerprint' | null> => {
    try {
      // Gunakan react-native-keychain untuk deteksi tipe biometrik
      const supportedBiometry = await Keychain.getSupportedBiometryType();
      
      console.log('🔍 [BIOMETRIC] Detected biometry type:', supportedBiometry);
      
      if (!supportedBiometry) {
        return null;
      }

      // Mapping ke tipe yang lebih user-friendly
      switch (supportedBiometry) {
        case Keychain.BIOMETRY_TYPE.FACE_ID:
        case Keychain.BIOMETRY_TYPE.FACE:
          return 'FaceID';
        
        case Keychain.BIOMETRY_TYPE.TOUCH_ID:
        case Keychain.BIOMETRY_TYPE.FINGERPRINT:
          return Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint';
        
        case Keychain.BIOMETRY_TYPE.IRIS:
          return 'Biometrics';
        
        default:
          return 'Biometrics';
      }
    } catch (error) {
      console.error('❌ [BIOMETRIC] Failed to detect biometry type:', error);
      return null;
    }
  }, []);

  /**
   * ✅ GET BIOMETRIC PROMPT MESSAGE BERDASARKAN TIPE
   */
  const getBiometricPromptMessage = useCallback((): { 
    title: string; 
    subtitle: string;
    buttonText: string;
  } => {
    switch (biometryType) {
      case 'FaceID':
        return {
          title: 'Login dengan Face ID',
          subtitle: 'Pindai Wajah untuk Masuk',
          buttonText: 'Login dengan Face ID'
        };
      
      case 'TouchID':
        return {
          title: 'Login dengan Touch ID', 
          subtitle: 'Tempelkan Jari untuk Masuk',
          buttonText: 'Login dengan Touch ID'
        };
      
      case 'Fingerprint':
        return {
          title: 'Login dengan Sidik Jari',
          subtitle: 'Tempelkan Jari untuk Masuk', 
          buttonText: 'Login dengan Sidik Jari'
        };
      
      default:
        return {
          title: 'Login dengan Biometrik',
          subtitle: 'Autentikasi untuk Masuk',
          buttonText: 'Login dengan Biometrik'
        };
    }
  }, [biometryType]);

  /**
   * Reset attempt counter
   */
  const resetAttemptCount = useCallback(() => {
    attemptCountRef.current = 0;
    console.log('✅ [SECURITY] Attempt counter reset');
  }, []);

  /**
   * Increment attempt counter dan check jika mencapai limit
   */
  const handleFailedAttempt = useCallback(async (): Promise<boolean> => {
    attemptCountRef.current += 1;
    console.log(`🔐 [SECURITY] Failed attempt: ${attemptCountRef.current}/${SECURITY_CONFIG.MAX_ATTEMPTS}`);
    
    if (attemptCountRef.current >= SECURITY_CONFIG.PERMANENT_LOCKOUT_AFTER) {
      console.warn('🚨 [SECURITY] PERMANENT LOCKOUT triggered!');
      permanentLockoutRef.current = true;
      await executeSecurityLockoutProtocol('PERMANENT_LOCKOUT');
      return true;
    }
    
    if (attemptCountRef.current >= SECURITY_CONFIG.MAX_ATTEMPTS) {
      console.warn(`🚨 [SECURITY] Temporary lockout triggered for ${SECURITY_CONFIG.LOCKOUT_DURATION / 60000} minutes`);
      await startLockoutTimer();
      return true;
    }
    
    return false;
  }, []);

  /**
   * Start lockout timer
   */
  const startLockoutTimer = useCallback(async (): Promise<void> => {
    setSecurityLockout(true);
    setLockoutTimeRemaining(SECURITY_CONFIG.LOCKOUT_DURATION);
    
    if (lockoutTimerRef.current) {
      clearInterval(lockoutTimerRef.current);
    }
    
    lockoutTimerRef.current = setInterval(() => {
      setLockoutTimeRemaining(prev => {
        if (prev <= 1000) {
          if (lockoutTimerRef.current) {
            clearInterval(lockoutTimerRef.current);
            lockoutTimerRef.current = null;
          }
          setSecurityLockout(false);
          resetAttemptCount();
          console.log('✅ [SECURITY] Lockout period ended');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    
    Alert.alert(
      '⏰ Biometric Lockout',
      `Terlalu banyak percobaan gagal. Coba lagi dalam ${SECURITY_CONFIG.LOCKOUT_DURATION / 60000} menit.`,
      [{ text: 'Mengerti' }],
      { cancelable: false }
    );
  }, []);

  /**
   * Deteksi error lockout dan fatal errors
   */
  const detectSecurityThreat = useCallback((error: any): { 
    isLockout: boolean; 
    isFatal: boolean;
    message: string;
    isCustomLockout?: boolean;
  } => {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    
    const errorLower = errorMessage.toLowerCase();
    const codeLower = errorCode.toLowerCase();

    const isSystemLockout = 
      errorLower.includes('lockout') ||
      errorLower.includes('too many attempts') ||
      errorLower.includes('maximum attempts') ||
      errorLower.includes('biometric locked') ||
      errorLower.includes('terlalu banyak percobaan') ||
      codeLower.includes('lockout') ||
      codeLower.includes('too_many_attempts') ||
      codeLower.includes('android_keystore_unauthorized') ||
      codeLower.includes('la_error_system') ||
      codeLower.includes('la_error_biometry_lockout');

    const isCustomLockout = securityLockout || permanentLockoutRef.current;

    const isFatal =
      errorLower.includes('not available') ||
      errorLower.includes('no biometry') ||
      errorLower.includes('hardware unavailable') ||
      errorLower.includes('permanently invalidated') ||
      errorLower.includes('keystore permanently invalidated') ||
      codeLower.includes('hardware_unavailable') ||
      codeLower.includes('no_biometrics') ||
      codeLower.includes('biometry_not_available');

    return {
      isLockout: isSystemLockout || isCustomLockout,
      isFatal,
      message: errorMessage,
      isCustomLockout
    };
  }, [securityLockout]);

  /**
   * 🔒 PROTOCOL KEAMANAN
   */
  const executeSecurityLockoutProtocol = useCallback(async (reason: string = 'LOCKOUT'): Promise<void> => {
    try {
      console.log(`🔒 [SECURITY] Executing security lockout protocol: ${reason}`);
      
      await Keychain.resetGenericPassword({ 
        service: 'com.ecostore.biometric.credentials' 
      });
      await authService.clearBiometricCredentials();
      await authService.logout();
      
      setSecurityLockout(true);
      setBiometricError(`Security lockout: ${reason}`);
      
      if (reason === 'PERMANENT_LOCKOUT') {
        Alert.alert(
          '🚨 Keamanan Diperketat',
          'Terlalu banyak percobaan akses tidak berhasil. ' +
          'Fitur biometrik telah dinonaktifkan secara permanen. ' +
          'Silakan login dengan password dan aktifkan kembali biometrik di settings.',
          [
            {
              text: 'Login dengan Password',
              onPress: () => {
                NavigationService.navigate('Login', { 
                  securityLockout: true,
                  permanentLockout: true
                });
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          '⏰ Akses Dibatasi Sementara',
          `Terlalu banyak percobaan gagal. Coba lagi dalam ${SECURITY_CONFIG.LOCKOUT_DURATION / 60000} menit.`,
          [{ text: 'Mengerti' }],
          { cancelable: false }
        );
      }
      
    } catch (securityError) {
      console.error('❌ [SECURITY] Security protocol failed:', securityError);
    }
  }, []);

  /**
   * ✅ CHECK BIOMETRIC AVAILABILITY DENGAN DETEKSI TIPE
   */
  const checkBiometricAvailability = useCallback(async (): Promise<BiometricAvailability> => {
    if (securityLockout || permanentLockoutRef.current) {
      return {
        isAvailable: false,
        hasCredentials: false,
        isEnrolled: true,
        error: permanentLockoutRef.current ? 
          'Biometric permanently disabled due to security' : 
          `Biometric temporarily locked. Try again in ${Math.ceil(lockoutTimeRemaining / 60000)} min`,
        errorCode: permanentLockoutRef.current ? 'PERMANENT_LOCKOUT' : 'TEMPORARY_LOCKOUT',
        biometricType: null
      };
    }

    try {
      // ✅ DETEKSI TIPE BIOMETRIK
      const detectedType = await detectBiometryType();
      setBiometryType(detectedType);

      const [isSupported, hasCredentials] = await Promise.all([
        authService.isBiometricSupported(),
        authService.hasStoredCredentials()
      ]);

      return {
        isAvailable: isSupported,
        hasCredentials,
        isEnrolled: true,
        biometricType: detectedType
      };
    } catch (error: any) {
      const securityThreat = detectSecurityThreat(error);
      
      if (securityThreat.isLockout && !securityThreat.isCustomLockout) {
        await executeSecurityLockoutProtocol('SYSTEM_LOCKOUT');
      }

      return {
        isAvailable: false,
        hasCredentials: false,
        isEnrolled: !securityThreat.isFatal,
        error: securityThreat.message,
        errorCode: securityThreat.isLockout ? 'LOCKOUT' : 'OTHER_ERROR',
        biometricType: null
      };
    }
  }, [securityLockout, lockoutTimeRemaining, detectBiometryType, detectSecurityThreat, executeSecurityLockoutProtocol]);

  /**
   * Tampilkan alert untuk kasus "Not Enrolled"
   */
  const showNotEnrolledAlert = useCallback((onFallback?: () => void) => {
    const { title, buttonText } = getBiometricPromptMessage();
    
    Alert.alert(
      `${title} Belum Diatur`,
      `Sidik jari/face ID belum diatur di perangkat ini. Silakan atur terlebih dahulu di Settings atau gunakan PIN manual.`,
      [
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('App-Prefs:TOUCHID_PASSCODE');
            } else {
              Linking.openSettings();
            }
          }
        },
        {
          text: 'Use PIN',
          onPress: onFallback,
          style: 'default'
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }, [getBiometricPromptMessage]);

  /**
   * ✅ LOGIN DENGAN BIOMETRIK - GUNAKAN PROMPT YANG SESUAI TIPE
   */
  const biometricLogin = useCallback(async (): Promise<HybridAuthResponse> => {
    if (securityLockout || permanentLockoutRef.current) {
      return {
        success: false,
        error: permanentLockoutRef.current ?
          'Biometric permanently disabled. Please use password.' :
          `Biometric locked. Try again in ${Math.ceil(lockoutTimeRemaining / 60000)} minutes`,
        method: 'biometric',
        requiresManualFallback: true,
        requiresEnrollment: false
      };
    }

    setIsBiometricLoading(true);
    setBiometricError(null);

    try {
      console.log('👆 [BIOMETRIC] Starting biometric authentication...');
      
      // ✅ GUNAKAN PROMPT MESSAGE YANG SESUAI DENGAN TIPE BIOMETRIK
      const promptConfig = getBiometricPromptMessage();
      console.log(`👆 [BIOMETRIC] Using prompt: ${promptConfig.subtitle}`);
      
      const result = await authService.loginWithBiometric();
      
      if (result.success) {
        resetAttemptCount();
        return result;
      }
      
      if (result.error) {
        setBiometricError(result.error);
        
        const shouldLockout = await handleFailedAttempt();
        if (shouldLockout) {
          return {
            ...result,
            requiresManualFallback: true,
            requiresEnrollment: false
          };
        }

        const securityThreat = detectSecurityThreat({ message: result.error });
        if (securityThreat.isLockout && !securityThreat.isCustomLockout) {
          await executeSecurityLockoutProtocol('SYSTEM_LOCKOUT');
        }

        const errorLower = result.error.toLowerCase();
        if (errorLower.includes('not enrolled') || 
            errorLower.includes('no biometric') ||
            errorLower.includes('not set up')) {
          
          return {
            ...result,
            requiresManualFallback: true,
            requiresEnrollment: true
          };
        }

        if (errorLower.includes('user cancel') || 
            errorLower.includes('authentication failed')) {
          return {
            ...result,
            requiresManualFallback: false
          };
        }

        return {
          ...result,
          requiresManualFallback: true
        };
      }

      return result;

    } catch (error: any) {
      console.error('👆 [BIOMETRIC] Biometric login error:', error);
      
      const shouldLockout = await handleFailedAttempt();
      const securityThreat = detectSecurityThreat(error);
      
      if (securityThreat.isLockout && !securityThreat.isCustomLockout) {
        await executeSecurityLockoutProtocol('SYSTEM_LOCKOUT');
      }

      const errorMessage = securityThreat.message || 'Biometric authentication failed';
      setBiometricError(errorMessage);
      
      const errorLower = errorMessage.toLowerCase();
      if (errorLower.includes('not enrolled') || 
          errorLower.includes('no biometric')) {
        return {
          success: false,
          error: errorMessage,
          method: 'biometric',
          requiresManualFallback: true,
          requiresEnrollment: true
        };
      }
      
      return {
        success: false,
        error: errorMessage,
        method: 'biometric',
        requiresManualFallback: !shouldLockout
      };
    } finally {
      setIsBiometricLoading(false);
    }
  }, [
    securityLockout, 
    lockoutTimeRemaining, 
    handleFailedAttempt, 
    detectSecurityThreat, 
    executeSecurityLockoutProtocol,
    resetAttemptCount,
    getBiometricPromptMessage
  ]);

  /**
   * Enable biometrik
   */
  const enableBiometric = useCallback(async (credentials: LoginCredentials): Promise<{
    success: boolean;
    error?: string;
    requiresEnrollment?: boolean;
  }> => {
    try {
      const isSupported = await authService.isBiometricSupported();
      
      if (!isSupported) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device'
        };
      }

      const success = await authService.storeCredentialsForBiometric(credentials);
      
      if (success) {
        console.log('✅ [BIOMETRIC] Biometric authentication enabled');
        return { success: true };
      } else {
        throw new Error('Failed to store credentials');
      }
    } catch (error: any) {
      console.error('❌ [BIOMETRIC] Failed to enable biometric:', error);
      setBiometricError(error.message);
      
      if (error.message?.toLowerCase().includes('not enrolled')) {
        return {
          success: false,
          error: error.message,
          requiresEnrollment: true
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }, []);

  /**
   * Disable biometrik
   */
  const disableBiometric = useCallback(async (): Promise<void> => {
    try {
      await authService.clearBiometricCredentials();
      setBiometricError(null);
      setSecurityLockout(false);
      permanentLockoutRef.current = false;
      resetAttemptCount();
      console.log('✅ [BIOMETRIC] Biometric authentication disabled');
    } catch (error: any) {
      console.error('❌ [BIOMETRIC] Failed to disable biometric:', error);
      setBiometricError(error.message);
    }
  }, []);

  /**
   * Reset security lockout
   */
  const resetSecurityLockout = useCallback(() => {
    setSecurityLockout(false);
    setLockoutTimeRemaining(0);
    permanentLockoutRef.current = false;
    resetAttemptCount();
    
    if (lockoutTimerRef.current) {
      clearInterval(lockoutTimerRef.current);
      lockoutTimerRef.current = null;
    }
    
    setBiometricError(null);
    console.log('✅ [SECURITY] All security locks reset');
  }, []);

  /**
   * Get current security status
   */
  const getSecurityStatus = useCallback(() => {
    return {
      attemptCount: attemptCountRef.current,
      maxAttempts: SECURITY_CONFIG.MAX_ATTEMPTS,
      isLocked: securityLockout,
      isPermanentlyLocked: permanentLockoutRef.current,
      timeRemaining: lockoutTimeRemaining,
      timeRemainingMinutes: Math.ceil(lockoutTimeRemaining / 60000)
    };
  }, [securityLockout, lockoutTimeRemaining]);

  /**
   * Manual trigger security lockout
   */
  const forceSecurityLockout = useCallback(async () => {
    await executeSecurityLockoutProtocol('MANUAL_TRIGGER');
  }, [executeSecurityLockoutProtocol]);

  /**
   * Tampilkan security alert
   */
  const showSecurityAlert = useCallback((isLockout: boolean) => {
    if (isLockout) {
      Alert.alert(
        '⚠️ Keamanan Diperketat',
        'Terlalu banyak percobaan akses tidak berhasil. ' +
        'Untuk melindungi data Anda, kami telah mengakhiri sesi ini. ' +
        'Silakan login ulang dengan metode alternatif.',
        [
          {
            text: 'Login Ulang',
            onPress: () => {
              // Trigger manual login flow
            }
          }
        ],
        { cancelable: false }
      );
    }
  }, []);

  const clearBiometricError = useCallback(() => {
    setBiometricError(null);
  }, []);

  return {
    // State
    isBiometricLoading,
    biometricError,
    securityLockout,
    lockoutTimeRemaining,
    biometryType, // ✅ EXPORT BIOMETRY TYPE
    
    // Methods
    biometricLogin,
    checkBiometricAvailability,
    enableBiometric,
    disableBiometric,
    clearBiometricError,
    showNotEnrolledAlert,
    
    // Security Methods
    resetSecurityLockout,
    forceSecurityLockout,
    showSecurityAlert,
    getSecurityStatus,
    
    // ✅ TAMBAHKAN METHOD UNTUK DAPATKAN PROMPT MESSAGE
    getBiometricPromptMessage,
  };
};