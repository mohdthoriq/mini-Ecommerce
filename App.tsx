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



import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SwipeProvider } from './src/context/SwipeContext';
import AnalyticsNavigationContainer from './src/routes/AnalyticsNavigationContainer';
import Navigation from './src/routes';
import { CartProvider } from './src/context/CartContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { InternetProvider } from './src/context/InternetContext';
import InternetStatusHandler from './src/components/InternetStatusHandler';
import { setupAndStoreApiKey } from './src/services/api/apiClient';
import { LinkingOptions, NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './src/types/navigation';
import { Linking } from 'react-native';
import { linkingConfig } from './src/config/linkingConfig';
import deepLinkingHandler from './src/utils/deepLinkingHandler';
import { RootDrawerParamList } from './src/types/navigation';


// Ignore specific warnings jika diperlukan
LogBox.ignoreLogs(['Some warning message']);

const App = () => {
  const [appReady, setAppReady] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

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
      console.log("🔥 Deep link received:", url);
      deepLinkingHandler.handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  // Custom linking configuration
  const linking: LinkingOptions<RootDrawerParamList> = {
    ...linkingConfig,
  };

  // Tampilkan loading screen selama setup
  if (!appReady) {
    return (
      <ErrorBoundary>
        <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
        {/* Loading component */}
      </ErrorBoundary>
    );
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
                onReady={() => {
                  console.log('🎯 NavigationContainer ready');
                  // Set navigation ref setelah container ready
                  deepLinkingHandler.setNavigationRef(navigationRef.current);
                  // Process pending URLs
                  setTimeout(() => {
                    deepLinkingHandler.processPendingUrl();
                  }, 1000);
                }}
                onStateChange={() => {
                  // Update navigation ref jika diperlukan
                  deepLinkingHandler.setNavigationRef(navigationRef.current);
                }}
                fallback={
                  <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
                }
              >
                <InternetStatusHandler>
                  <StatusBar
                    backgroundColor="#2e7d32"
                    barStyle="light-content"
                  />
                    <Navigation />
                </InternetStatusHandler>
              </NavigationContainer>
            </SwipeProvider>
          </CartProvider>
        </AuthProvider>
      </InternetProvider>
    </ErrorBoundary>
  );
};

export default App;