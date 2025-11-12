import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import HomeScreen from '../screens/dashboard/Home';
import ProductDetailScreen from '../screens/dashboard/ProductDetailScreen';
import ProfileScreen from '../screens/dashboard/Profile';
import LoginScreen from '../screens/auth/Login';


const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, 
      }}
      initialRouteName="Home"
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: '🌿 Eco Shop',
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ 
          title: 'Product Details',
           headerShown: true, 
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'My Profile',
           headerShown: true,
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Login',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;