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
import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SwipeProvider } from './src/context/SwipeContext';
import AnalyticsNavigationContainer from './src/routes/AnalyticsNavigationContainer';
import Navigation from './src/routes';
import { CartProvider } from './src/context/CartContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { InternetProvider } from './src/context/InternetContext';
import InternetStatusHandler from './src/components/InternetStatusHandler';

const App = () => {
  return (
    <ErrorBoundary>
      <InternetProvider>
        <AuthProvider>
          <CartProvider>
            <SwipeProvider>
              <AnalyticsNavigationContainer>
                {/* InternetStatusHandler untuk manage offline state secara global */}
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