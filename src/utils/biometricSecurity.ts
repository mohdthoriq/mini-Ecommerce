// utils/biometricSecurity.ts
import { Alert, Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { NavigationService } from '../services/navigation/navigationService';
import { authService } from '../services/auth/authService';

// ✅ DEFINE BIOMETRIC ERROR TYPES
export interface BiometricError {
  code: string;
  message: string;
  isFatal: boolean;
  requiresLogout: boolean;
}

export interface SecurityResponse {
  success: boolean;
  error?: BiometricError;
  shouldLogout?: boolean;
}

// ✅ DETECT LOCKOUT & FATAL ERRORS
export const detectFatalBiometricError = (error: any): BiometricError => {
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  
  const errorLower = errorMessage.toLowerCase();
  const codeLower = errorCode.toLowerCase();

  // ✅ DETECT LOCKOUT ERRORS (BERGANTUNG PADA LIBRARY YANG DIGUNAKAN)
  const isLockout = 
    errorLower.includes('lockout') ||
    errorLower.includes('too many attempts') ||
    errorLower.includes('maximum attempts') ||
    errorLower.includes('biometric locked') ||
    codeLower.includes('lockout') ||
    codeLower.includes('too_many_attempts') ||
    codeLower.includes('android_keystore_unauthorized') || // Android specific
    codeLower.includes('la_error_system') || // iOS LAErrorSystem
    codeLower.includes('la_error_biometry_lockout'); // iOS LAErrorBiometryLockout

  // ✅ DETECT OTHER FATAL ERRORS
  const isFatalError =
    errorLower.includes('not available') ||
    errorLower.includes('no biometry') ||
    errorLower.includes('hardware unavailable') ||
    errorLower.includes('permanently invalidated') ||
    codeLower.includes('hardware_unavailable') ||
    codeLower.includes('no_biometrics') ||
    codeLower.includes('biometry_not_available');

  return {
    code: errorCode,
    message: errorMessage,
    isFatal: isLockout || isFatalError,
    requiresLogout: isLockout // ✅ LOCKOUT MEMERLUKAN LOGOUT FORCE
  };
};

// ✅ SECURE BIOMETRIC PROMPT WITH LOCKOUT PROTECTION
export const secureBiometricPrompt = async (
  promptConfig: any
): Promise<SecurityResponse> => {
  try {
    // Your biometric library call here (contoh dengan react-native-keychain)
    const result = await Keychain.getGenericPassword({
      service: 'com.yourapp.biometric',
      authenticationPrompt: promptConfig
    });

    if (result) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: {
          code: 'AUTH_FAILED',
          message: 'Biometric authentication failed',
          isFatal: false,
          requiresLogout: false
        }
      };
    }

  } catch (error: any) {
    console.error('🔒 [SECURITY] Biometric error:', error);
    
    const securityError = detectFatalBiometricError(error);
    
    if (securityError.requiresLogout) {
      console.warn('🚨 [SECURITY] Biometric lockout detected! Forcing logout...');
      
      // ✅ IMMEDIATE SECURITY RESPONSE
      await handleSecurityLockout();
      
      return {
        success: false,
        error: securityError,
        shouldLogout: true
      };
    }

    return {
      success: false,
      error: securityError
    };
  }
};

// ✅ HANDLE SECURITY LOCKOUT - PENTING UNTUK KEAMANAN
export const handleSecurityLockout = async (): Promise<void> => {
  try {
    console.log('🔒 [SECURITY] Executing security lockout protocol...');
    
    // ✅ 1. HAPUS DATA SENSITIF DI KEYCHAIN - PENTING!
    //    Alasan: Mencegah akses tidak sah ke credential meski sensor terkunci
    await Keychain.resetGenericPassword({ 
      service: 'com.yourapp.biometric' 
    });
    await Keychain.resetGenericPassword({ 
      service: 'com.yourapp.credentials' 
    });
    console.log('✅ [SECURITY] Keychain credentials cleared');
    
    // ✅ 2. LOGOUT DARI APLIKASI - PENTING!
    //    Alasan: Menghentikan sesi yang mungkin masih aktif
    await authService.logout();
    console.log('✅ [SECURITY] User session terminated');
    
    // ✅ 3. CLEAR LOCAL STORAGE/SECURE STORAGE
    //    Alasan: Menghapus data sensitif dari memory device
    try {
      await authService.clearBiometricCredentials();
    } catch (clearError) {
      console.warn('⚠️ [SECURITY] Partial clear error:', clearError);
    }
    
    // ✅ 4. NAVIGASI PAKSA KE LOGIN - PENTING!
    //    Alasan: Memaksa user untuk login ulang dengan metode alternatif
    setTimeout(() => {
      NavigationService.navigate('Login', { 
        securityLockout: true,
        message: 'Sesi diakhiri demi keamanan. Silakan login ulang.' 
      });
    }, 1000);
    
    console.log('✅ [SECURITY] Security lockout protocol completed');
    
  } catch (securityError) {
    console.error('❌ [SECURITY] Security protocol failed:', securityError);
    
    // ✅ FALLBACK: NAVIGASI LANGSUNG KE LOGIN MESKI ADA ERROR
    NavigationService.navigate('Login', { 
      securityLockout: true,
      message: 'Terjadi masalah keamanan. Silakan login ulang.' 
    });
  }
};

// ✅ SHOW SECURITY ALERT TO USER
export const showSecurityAlert = (error: BiometricError): void => {
  if (error.requiresLogout) {
    Alert.alert(
      '⚠️ Keamanan Diperketat',
      'Terlalu banyak percobaan akses tidak berhasil. ' +
      'Untuk melindungi data Anda, kami telah mengakhiri sesi ini. ' +
      'Silakan login ulang dengan metode alternatif.',
      [
        {
          text: 'Login Ulang',
          onPress: () => {
            NavigationService.navigate('Login', { 
              securityLockout: true 
            });
          }
        }
      ],
      { cancelable: false }
    );
  } else if (error.isFatal) {
    Alert.alert(
      '⚠️ Biometrik Tidak Tersedia',
      'Fitur biometrik saat ini tidak dapat digunakan. ' +
      'Silakan gunakan metode login alternatif.',
      [{ text: 'Mengerti' }]
    );
  }
};