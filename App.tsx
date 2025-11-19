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



// App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SwipeProvider } from './src/context/SwipeContext';
import AnalyticsNavigationContainer from './src/routes/AnalyticsNavigationContainer';
import Navigation from './src/routes';
import { CartProvider } from './src/context/CartContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { InternetProvider } from './src/context/InternetContext';
import InternetStatusHandler from './src/components/InternetStatusHandler';
import { setupAndStoreApiKey } from './src/services/api/apiClient'; // Import dari file yang sama

const App = () => {
  const [appReady, setAppReady] = useState(false);

  // Setup API Key saat aplikasi pertama kali dijalankan
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing application...');
        
        // Setup API Key di Keychain
        await setupAndStoreApiKey();
        
        console.log('✅ Application initialization completed');
        setAppReady(true);
        
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
        // Tetap lanjut meski ada error, API mungkin tetap work tanpa key
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

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
              <AnalyticsNavigationContainer>
                <InternetStatusHandler>
                  <StatusBar 
                    backgroundColor="#2e7d32" 
                    barStyle="light-content" 
                  />
                  <Navigation />
                </InternetStatusHandler>
              </AnalyticsNavigationContainer>
            </SwipeProvider>
          </CartProvider>
        </AuthProvider>
      </InternetProvider>
    </ErrorBoundary>
  );
};

export default App;


// import React from 'react';
// import BasicKeychain from './src/components/BasicKeyChain';

// export default function App() {
//   return (
//     <>
//       <BasicKeychain />
//     </>
//   )
// }

//