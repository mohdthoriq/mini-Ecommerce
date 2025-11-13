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

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SwipeProvider>
          <AnalyticsNavigationContainer>
            <StatusBar 
              backgroundColor="#2e7d32" 
              barStyle="light-content" 
            />
            <Navigation />
          </AnalyticsNavigationContainer>
        </SwipeProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;