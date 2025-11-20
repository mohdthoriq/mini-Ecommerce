import { useEffect, useState, useCallback } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { DeviceEventEmitter, Platform } from 'react-native';
import deepLinkingHandler from '../utils/deepLinkingHandler';
import { RootStackParamList } from '../types/navigation';

interface UseDeepLinkingReturn {
  isDeepLinkingReady: boolean;
  processPendingUrl: () => void;
  deepLinkState: {
    isReady: boolean;
    pendingUrl: string | null;
    hasNavigationRef: boolean;
  };
}

export const useDeepLinking = (
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>
): UseDeepLinkingReturn => {
  const [isDeepLinkingReady, setIsDeepLinkingReady] = useState<boolean>(false);

  useEffect(() => {
    const initDeepLinking = async (): Promise<void> => {
      try {
        // Set navigation reference - pass the current ref value
        deepLinkingHandler.setNavigationRef(navigationRef.current);

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
          console.log('Initial URL found:', initialUrl);
          deepLinkingHandler.handleDeepLink(initialUrl);
        }

        setIsDeepLinkingReady(true);
        console.log('useDeepLinking hook initialized');
      } catch (error) {
        console.log('Error in useDeepLinking hook:', error);
        setIsDeepLinkingReady(true);
      }
    };

    initDeepLinking();

    // Cleanup
    return () => {
      deepLinkingHandler.cleanup();
    };
  }, [navigationRef]);

  const processPendingUrl = useCallback((): void => {
    deepLinkingHandler.processPendingUrl();
  }, []);

  const deepLinkState = deepLinkingHandler.getState();

  return { 
    isDeepLinkingReady, 
    processPendingUrl,
    deepLinkState
  };
};