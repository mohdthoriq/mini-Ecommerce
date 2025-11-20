import { useEffect, useState, useCallback } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { DeviceEventEmitter, Platform } from 'react-native';
import deepLinkingHandler from '../utils/deepLinkingHandler';
import { RootStackParamList } from '../types/navigation';
import { DeepLinkCallbacks } from '../utils/deepLinkingHandler';

interface UseDeepLinkingReturn {
  isDeepLinkingReady: boolean;
  processPendingUrl: () => void;
  deepLinkState: {
    isReady: boolean;
    pendingUrl: string | null;
    hasNavigationRef: boolean;
  };
  testAddToCart: (productId?: string) => void;
}

export const useDeepLinking = (
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>,
  callbacks?: DeepLinkCallbacks
): UseDeepLinkingReturn => {
  const [isDeepLinkingReady, setIsDeepLinkingReady] = useState<boolean>(false);

  useEffect(() => {
    const initDeepLinking = async (): Promise<void> => {
      try {
        // Set navigation reference
        deepLinkingHandler.setNavigationRef(navigationRef.current);

        // Set external callbacks jika provided
        if (callbacks) {
          deepLinkingHandler.setCallbacks(callbacks);
        }

        // Initialize deep linking
        const initialUrl = await deepLinkingHandler.initialize();

        // Setup native event listener untuk Android
        if (Platform.OS === 'android') {
          const subscription = DeviceEventEmitter.addListener(
            'onDeepLink',
            (url: string) => {
              deepLinkingHandler.handleNativeDeepLink(url);
            }
          );
        }

        // Process initial URL jika ada
        if (initialUrl) {
          console.log('📱 Initial URL found:', initialUrl);
          deepLinkingHandler.handleDeepLink(initialUrl);
        }

        setIsDeepLinkingReady(true);
        console.log('✅ useDeepLinking hook initialized');
      } catch (error) {
        console.log('❌ Error in useDeepLinking hook:', error);
        setIsDeepLinkingReady(true);
      }
    };

    initDeepLinking();

    // Cleanup
    return () => {
      deepLinkingHandler.cleanup();
    };
  }, [navigationRef, callbacks]);

  const processPendingUrl = useCallback((): void => {
    deepLinkingHandler.processPendingUrl();
  }, []);

  const testAddToCart = useCallback((productId: string = '55'): void => {
    deepLinkingHandler.testAddToCartDeepLink(productId);
  }, []);

  const deepLinkState = deepLinkingHandler.getState();

  return { 
    isDeepLinkingReady, 
    processPendingUrl,
    deepLinkState,
    testAddToCart
  };
};