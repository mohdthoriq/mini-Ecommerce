import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ProductListScreen from './src/screens/ProductListScreen';

const App: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <ProductListScreen />
    </SafeAreaView>
  );
};

export default App;