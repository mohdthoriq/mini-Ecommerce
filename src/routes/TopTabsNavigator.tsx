import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { TopTabsParamList } from '../types';
import PopularScreen from '../screens/categories/Popular';
import NewScreen from '../screens/categories/New';
import DiscountScreen from '../screens/categories/Discount';
import ElectronicsScreen from '../screens/categories/Electronics';
import ClothingScreen from '../screens/categories/Clothing';
import FoodScreen from '../screens/categories/Food';
import AutomotiveScreen from '../screens/categories/Automotive';
import EntertainmentScreen from '../screens/categories/Entertainment';
import BabyScreen from '../screens/categories/Baby';
import AuthGuard from './AuthGuard';

const Tab = createMaterialTopTabNavigator<TopTabsParamList>();

const TopTabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: { 
          width: 'auto',
          paddingHorizontal: 16,
        },
        tabBarStyle: {
          backgroundColor: '#f8f9fa',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#2e7d32',
          height: 3,
        },
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen name="Popular" component={PopularScreen} />
      <Tab.Screen name="New" component={NewScreen} />
      <Tab.Screen name="Discount" component={DiscountScreen} />
      <Tab.Screen name="Electronics" component={ElectronicsScreen} />
      <Tab.Screen name="Clothing" component={ClothingScreen} />
      <Tab.Screen name="Food" component={FoodScreen} />
      <Tab.Screen name="Automotive" component={AutomotiveScreen} />
      <Tab.Screen name="Entertainment" component={EntertainmentScreen} />
      <Tab.Screen name="Baby">
        {() => <AuthGuard><BabyScreen /></AuthGuard>}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TopTabsNavigator;