// utils/simplePrompt.ts - FIXED VERSION
import { Alert, Platform } from 'react-native';

// ✅ DEFINE PromptResult INTERFACE
interface PromptResult {
  success: boolean;
  message?: string;
}

interface PromptOptions {
  confirmText?: string;
  cancelText?: string;
  title?: string;
  type?: 'default' | 'warning' | 'danger';
}

export const simplePrompt = (
  promptMessage: string,
  options?: PromptOptions
): Promise<PromptResult> => {  // ✅ NOW PromptResult IS DEFINED
  return new Promise((resolve) => {
    const {
      confirmText = 'Konfirmasi',
      cancelText = 'Batal',
      title = 'Konfirmasi Transaksi',
      type = 'default'
    } = options || {};

    // Styling berdasarkan type
    const getConfirmButtonStyle = () => {
      switch (type) {
        case 'danger':
          return 'destructive';
        case 'warning':
          return Platform.OS === 'ios' ? 'default' : 'destructive';
        default:
          return 'default';
      }
    };

    Alert.alert(
      title,
      promptMessage,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => resolve({ 
            success: false, 
            message: 'Transaksi dibatalkan' 
          })
        },
        {
          text: confirmText,
          style: getConfirmButtonStyle(),
          onPress: () => resolve({ 
            success: true, 
            message: 'Transaksi dikonfirmasi' 
          })
        }
      ],
      { 
        cancelable: true,
        onDismiss: () => resolve({ 
          success: false, 
          message: 'Dialog ditutup' 
        })
      }
    );
  });
};

// Export type untuk digunakan di file lain
export type { PromptResult, PromptOptions };