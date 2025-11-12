import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import DrawerNavigator from './DrawerNavigator'; // Ganti ke DrawerNavigator

const Navigation = () => {
  return (
    // AuthProvider sudah ada di App.tsx, tidak perlu di sini lagi
      <DrawerNavigator />
  );
};

export default Navigation;