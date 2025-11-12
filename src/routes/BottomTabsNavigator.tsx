import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabsParamList } from '../types';
import CategoriesWithTopTabs from './CategoriesWithTopTabs';
import ProfileScreen from '../screens/dashboard/Profile';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import HomeScreen from '../screens/dashboard/Home';
import AnalyticsHistoryScreen from '../screens/dashboard/AnalyticsHistory';

const Tab = createBottomTabNavigator<BottomTabsParamList>();

const BottomTabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
      initialRouteName="CategoriesTopTabs"
    >
      {/* Categories Tab */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="house" size={size} color={color} iconStyle='solid' />
          ),
        }}
      />

      {/* Categories Tab */}
      <Tab.Screen
        name="CategoriesTopTabs"
        component={CategoriesWithTopTabs}
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="cube" size={size} color={color} iconStyle='solid' />
          ),
        }}
      />

      <Tab.Screen
        name="Analytics"
        component={AnalyticsHistoryScreen}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size, focused }) => (
            <FontAwesome6
              name={focused ? "chart-line" : "chart-simple"}
              size={size}
              color={color}
              iconStyle='solid'
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="user" size={size} color={color} iconStyle='solid' />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabsNavigator;