import React, { useContext, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import HomeScreen from '../screens/dashboard/Home';
import TopTabsNavigator from './TopTabsNavigator';
import ProductDetailScreen from '../screens/dashboard/ProductDetailScreen';
import ProfileScreen from '../screens/dashboard/Profile';
import LoginScreen from '../screens/auth/Login';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import BottomTabsNavigator from './BottomTabsNavigator';
import RootDrawerNavigator from './DrawerNavigator';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => {
  const { isAuthenticated } = useContext(AuthContext);
  
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ navigation, route, options }) => (
          <Header
            title={options.title || route.name}
            showBackButton={navigation.canGoBack()}
          />
        ),
      }}
      initialRouteName="Home"
    >
      <Stack.Screen 
        name="Home" 
        component={RootDrawerNavigator}
        options={{ 
          title: '🌿 Eco Shop',
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="CategoriesWithBottomTabs" 
        component={BottomTabsNavigator}
        options={{ 
          title: 'Categories',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ 
          title: 'Product Details',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'My Profile',
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Login',
          headerShown: false // Hide header for login to use custom back button
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;