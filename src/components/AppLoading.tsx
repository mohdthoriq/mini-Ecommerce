import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import ErrorBoundary from './ErrorBoundary';

/**
 * Loading component untuk initial app startup
 */
const AppLoading: React.FC = () => {
  return (
    <ErrorBoundary>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <Text style={{
          fontSize: 16,
          color: '#666',
          marginTop: 16
        }}>
          Initializing App...
        </Text>
      </View>
    </ErrorBoundary>
  );
};

export default AppLoading;