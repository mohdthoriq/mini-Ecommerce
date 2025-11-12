import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types';
import SettingsScreen from '../screens/settings/Setting';
import LoginScreen from '../screens/auth/Login';
import CustomDrawerContent from '../components/CustomDrawerContent';
import BottomTabsNavigator from './BottomTabsNavigator';
import HomeScreen from '../screens/dashboard/Home';
import { Text, TouchableOpacity, View } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useSwipe } from '../context/SwipeContext';
import { useDrawerLock } from '../hooks/useDrawerLock';
import ProductDetailScreen from '../screens/dashboard/ProductDetailScreen';
import CheckoutModalScreen from '../screens/dashboard/CheckoutModal';
import AnalyticsHistoryScreen from '../screens/dashboard/AnalyticsHistory';
import ProfileScreen from '../screens/dashboard/Profile';


const Drawer = createDrawerNavigator<RootDrawerParamList>();

const DrawerNavigator = () => {
  const { canSwipe } = useSwipe();
  const { shouldLockDrawer, drawerLockMode } = useDrawerLock()

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => {

        const lockedScreens = ['ProductDetail', 'CheckoutModal'];
        const shouldLockDrawer = lockedScreens.includes(route.name);


        const drawerLockMode = shouldLockDrawer ? 'locked-closed' : 'unlocked';

        return {
          headerShown: true,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 80 }}>
              <FontAwesome6 name="leaf" size={20} color="#2af310ff" iconStyle='solid' style={{ marginRight: 8 }} />
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: '#ffffff',
              }}>
                Eco Shop
              </Text>
            </View>
          ),
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#ffffff',
            marginLeft: 20,
          },
          headerStyle: {
            backgroundColor: '#2e7d32',
          },
          headerTintColor: '#ffffff',
          headerLeft: () => {
            const isHomeScreen = route.name === 'Home';

            if (isHomeScreen) {
              return (
                <TouchableOpacity
                  style={{ marginLeft: 16 }}
                  onPress={() => navigation.toggleDrawer()}
                >
                  <FontAwesome6 name="bars" size={24} color="#ffffff" iconStyle='solid' />
                </TouchableOpacity>
              );
            } else {
              return (
                <TouchableOpacity
                  style={{ marginLeft: 16 }}
                  onPress={() => navigation.goBack()}
                >
                  <FontAwesome6 name="arrow-left" size={24} color="#ffffff" iconStyle='solid' />
                </TouchableOpacity>
              );
            }
          },
          drawerStyle: {
            backgroundColor: '#f0f7f0',
            width: 280,
          },
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: '500',
            color: '#2e7d32',
          },
          drawerActiveBackgroundColor: '#4caf50',
          drawerActiveTintColor: '#ffffff',
          drawerInactiveTintColor: '#2e7d32',
          swipeEnabled: canSwipe && !shouldLockDrawer,
          drawerLockMode: drawerLockMode,
        };
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color, size }) => (<FontAwesome6 name="house" size={size} color={color} iconStyle='solid' />),
          // title: '🏠 Home',
        }}
      />

      <Drawer.Screen
        name="CategoriesWithBottomTabs"
        component={BottomTabsNavigator}
        options={{
          drawerIcon: ({ color, size }) => (<FontAwesome6 name="cube" size={size} color={color} iconStyle='solid' />),
          title: 'Categories',
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (<FontAwesome6 name="gear" size={size} color={color} iconStyle='solid' />),
          title: 'Settings',
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (<FontAwesome6 name="user" size={size} color={color} iconStyle='solid' />),
          title: '👤 Profile',
        }}
      />

      <Drawer.Screen
        name="Analytics"
        component={AnalyticsHistoryScreen}
        options={{
          title: 'Analytics',
          drawerIcon: ({ color, size }) => (
            <FontAwesome6 name="chart-line" size={size} color={color} iconStyle='solid' />
          ),
        }}
      />

      <Drawer.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: '🔐 Login',
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* ✅ TAMBAH SCREEN YANG PERLU DI-LOCK */}
      <Drawer.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: 'Product Details',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="CheckoutModal"
        component={CheckoutModalScreen}
        options={{
          title: 'Checkout',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;