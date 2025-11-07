import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProductListScreen from './src/screens/ProductListScreen';
import { StatusBar } from 'react-native';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FF4444" 
        translucent={true}
      />
      <ProductListScreen />
    </SafeAreaProvider>
  );
};

export default App;