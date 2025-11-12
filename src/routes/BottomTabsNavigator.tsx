import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabsParamList } from '../types';
import CategoriesWithTopTabs from './CategoriesWithTopTabs';
import ProfileScreen from '../screens/dashboard/Profile';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import HomeScreen from '../screens/dashboard/Home';
import AnalyticsHistoryScreen from '../screens/dashboard/AnalyticsHistory';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types';

const Tab = createBottomTabNavigator<BottomTabsParamList>();

const BottomTabsNavigator = () => {
  const { isAuthenticated } = useAuth();
  const drawerNavigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

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
      {/* Home Tab - Navigate ke Home screen di Drawer */}
      <Tab.Screen
        name="Home"
        component={HomeScreen} // Tetap butuh component, tapi tidak akan digunakan
        listeners={() => ({
          tabPress: (e) => {
            // Mencegah navigasi default ke HomeScreen di dalam tab
            e.preventDefault();
            // Navigate ke Home screen yang asli di Drawer Navigator
            drawerNavigation.navigate('Home');
          },
        })}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="house" size={size} color={color} iconStyle='solid' />
          ),
        }}
      />

      {/* Categories Tab - Normal behavior */}
      <Tab.Screen
        name="CategoriesTopTabs"
        component={CategoriesWithTopTabs}
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="cube" size={size} color={color} iconStyle='solid'  />
          ),
        }}
      />

      {/* Analytics Tab - Normal behavior */}
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

      {/* Profile Tab dengan kondisi login */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={() => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              // Prevent default navigation ke Profile
              e.preventDefault();
              // Tampilkan alert dan arahkan ke Login di Drawer
              Alert.alert(
                'Login Required',
                'Please login to access your profile',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Login',
                    onPress: () => drawerNavigation.navigate('Login'),
                  },
                ]
              );
            }
            // Jika sudah login, biarkan navigasi default berjalan
          },
        })}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabsNavigator;