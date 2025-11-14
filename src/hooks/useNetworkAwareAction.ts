import { useInternet } from '../context/InternetContext';
import { Alert } from 'react-native';

/**
 * Hook untuk handle action yang membutuhkan koneksi internet
 */
export const useNetworkAwareAction = () => {
  const { isInternetReachable } = useInternet();

  const executeIfOnline = async (
    action: () => Promise<void>,
    options?: {
      showAlert?: boolean;
      alertTitle?: string;
      alertMessage?: string;
    }
  ): Promise<void> => {
    const {
      showAlert = true,
      alertTitle = 'Tidak Terkoneksi',
      alertMessage = 'Anda sedang offline. Silakan periksa koneksi internet Anda.'
    } = options || {};

    if (!isInternetReachable) {
      if (showAlert) {
        Alert.alert(alertTitle, alertMessage);
      }
      throw new Error('NO_INTERNET_CONNECTION');
    }

    try {
      await action();
    } catch (error) {
      // Re-throw the error with proper typing
      if (error instanceof Error) {
        throw error;
      } else if (typeof error === 'string') {
        throw new Error(error);
      } else {
        throw new Error('Unknown error occurred');
      }
    }
  };

  return {
    executeIfOnline,
    isInternetReachable
  };
};