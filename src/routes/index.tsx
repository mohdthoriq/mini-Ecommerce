import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import HomeStackNavigator from './HomeStackNavigator';

const Navigation = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <HomeStackNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default Navigation;