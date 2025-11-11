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
import { SwipeProvider } from './src/context/SwipeContext'; // ✅ IMPORT DARI CONTEXT
import Navigation from './src/routes';

const App = () => {
  return (
    <AuthProvider>
      <SwipeProvider> {/* ✅ SWIPE PROVIDER */}
        <StatusBar 
          backgroundColor="#2e7d32" 
          barStyle="light-content" 
        />
        <Navigation />
      </SwipeProvider>
    </AuthProvider>
  );
};

export default App;