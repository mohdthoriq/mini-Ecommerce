// import React from 'react';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import ProductListScreen from './src/screens/dashboard/ProductListScreen';
// import { StatusBar } from 'react-native';

// import RootNavigator from "./src/routes/RootNavigator";
// import React from "react";


// const App: React.FC = () => {
//   return (
//     <SafeAreaProvider>
//       <StatusBar 
//         barStyle="dark-content" 
//         backgroundColor="#FF4444" 
//         translucent={true}
//       />
//       <ProductListScreen />
//     </SafeAreaProvider>
//   );
// };

// export default App;

// export default function App() {
//   return (
//     <>
//       <RootNavigator />
//     </>
//   )
// }



import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar, LogBox } from 'react-native';
import AuthProvider from './src/context/AuthContext';
import { SwipeProvider } from './src/context/SwipeContext';
import Navigation from './src/routes';
import { CartProvider } from './src/context/CartContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { InternetProvider } from './src/context/InternetContext';
import InternetStatusHandler from './src/components/InternetStatusHandler';
import { setupAndStoreApiKey } from './src/services/api/apiClient';
import { LinkingOptions, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { RootDrawerParamList } from './src/types/navigation';
import { Linking } from 'react-native';
import { linkingConfig } from './src/config/linkingConfig';
import deepLinkingHandler from './src/utils/deepLinkingHandler';

// Components
import DeepLinkHandler from './src/components/DeepLinkHandler';
import AppLoading from './src/components/AppLoading';

// Ignore specific warnings jika diperlukan
LogBox.ignoreLogs(['Some warning message']);

const App = () => {
  const [appReady, setAppReady] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // ✅ Handle warm start deep links
  const handleWarmStart = useCallback((url: string | null) => {
    if (url) {
      console.log('🔥 Warm start URL received:', url);
      deepLinkingHandler.handleDeepLink(url);
    }
  }, []);

  // Setup API Key dan Deep Linking saat aplikasi pertama kali dijalankan
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing application...');

        // Setup API Key di Keychain
        await setupAndStoreApiKey();

        // Initialize deep linking handler
        await deepLinkingHandler.initialize();

        console.log('✅ Application initialization completed');
        setAppReady(true);

      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Handle deep link events untuk warm start
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log("🔥 Deep link received (warm start):", url);
      handleWarmStart(url);
    });

    return () => subscription.remove();
  }, [handleWarmStart]);

  // Custom linking configuration
  const linking: LinkingOptions<RootDrawerParamList> = {
    // linkingConfig sudah berisi prefixes dan config, jadi kita hanya perlu
    // menambahkan getInitialURL agar React Navigation menanganinya secara otomatis.
    ...linkingConfig,
  };

  // ✅ Enhanced navigation container ready handler
  const handleNavigationReady = useCallback(() => {
    console.log('🎯 NavigationContainer ready');
    
    // Set navigation ref setelah container ready
    deepLinkingHandler.setNavigationRef(navigationRef.current);

    // React Navigation akan menangani initial URL secara otomatis.
  }, []);

  // ✅ Enhanced state change handler
  const handleStateChange = useCallback(() => {
    // Update navigation ref jika diperlukan
    deepLinkingHandler.setNavigationRef(navigationRef.current);
  }, []);

  // Tampilkan loading screen selama setup
  if (!appReady) {
    return <AppLoading />;
  }

  return (
    <ErrorBoundary>
      <InternetProvider>
        <AuthProvider>
          <CartProvider>
            <SwipeProvider>
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                onReady={handleNavigationReady}
                onStateChange={handleStateChange}
                fallback={<AppLoading />}
              >
                <DeepLinkHandler>
                  <InternetStatusHandler>
                    <StatusBar
                      backgroundColor="#2e7d32"
                      barStyle="light-content"
                    />
                    <Navigation />
                  </InternetStatusHandler>
                </DeepLinkHandler>
              </NavigationContainer>
            </SwipeProvider>
          </CartProvider>
        </AuthProvider>
      </InternetProvider>
    </ErrorBoundary>
  );
};

export default App;