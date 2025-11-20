import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types';
import SettingsScreen from '../screens/settings/Setting';
import LoginScreen from '../screens/auth/Login';
import CustomDrawerContent from '../components/CustomDrawerContent';
import BottomTabsNavigator from './BottomTabsNavigator';
import HomeScreen from '../screens/dashboard/Home';
import { Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useSwipe } from '../context/SwipeContext';
import { useDrawerLock } from '../hooks/useDrawerLock';
import ProductDetailScreen from '../screens/dashboard/ProductDetailScreen';
import CheckoutModalScreen from '../screens/dashboard/CheckoutModal';
import CartScreen from '../screens/dashboard/Cart';
import ProductListScreen from '../screens/dashboard/ProductListScreen';
import AnalyticsHistoryScreen from '../screens/dashboard/AnalyticsHistory';
import ProfileScreen from '../screens/dashboard/Profile';
import AuthGuard from './AuthGuard';
import TestErrorScreen from '../screens/auth/TestErrorScreen';


const Drawer = createDrawerNavigator<RootDrawerParamList>();

const DrawerNavigator = () => {
  const { canSwipe } = useSwipe();
  const { shouldLockDrawer, drawerLockMode } = useDrawerLock()
  const { cartItemCount } = useCart();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => {

        const lockedScreens = ['ProductDetail', 'CheckoutModal'];
        const isDrawerLocked = lockedScreens.includes(route.name);


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
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16, position: 'relative' }}
                onPress={() => navigation.navigate('Cart')}
              >
                <FontAwesome6 name="cart-shopping" size={24} color="#ffffff" iconStyle='solid' />
                {cartItemCount > 0 && (
                  <View style={{
                    position: 'absolute', right: -8, top: -4, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center'
                  }}>
                    <Text style={{
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {cartItemCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
          ),
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
          swipeEnabled: canSwipe && !isDrawerLocked,
          drawerLockMode: drawerLockMode,
        };
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome6 name="house" size={size} color={color} iconStyle="solid" />
          ),
        }}
      />

      {/* Semua screen lain pake AuthGuard */}
      <Drawer.Screen
        name="CategoriesWithBottomTabs"
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome6 name="cube" size={size} color={color} iconStyle="solid" />
          ),
          title: 'Categories',
          headerShown: true,
        }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <BottomTabsNavigator />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="Settings"
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome6 name="gear" size={size} color={color} iconStyle="solid" />
          ),
          title: 'Settings',
        }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <SettingsScreen />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="Profile"
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome6 name="user" size={size} color={color} iconStyle="solid" />
          ),
          title: '👤 Profile',
        }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <ProfileScreen />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="Analytics"
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesome6 name="chart-line" size={size} color={color} iconStyle="solid" />
          ),
          title: 'Analytics',
        }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <AnalyticsHistoryScreen />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: '🔐 Login',
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* Screens yang disembunyi dari drawer, tapi perlu proteksi */}
      <Drawer.Screen
        name="ProductDetail"
        options={{ title: 'Product Details', drawerItemStyle: { display: 'none' } }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <ProductDetailScreen />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="CheckoutModal"
        options={{ title: 'Checkout', drawerItemStyle: { display: 'none' } }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <CheckoutModalScreen />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="Cart"
        options={{ title: 'Shopping Cart', drawerItemStyle: { display: 'none' } }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <CartScreen />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="ProductList"
        options={{ title: 'All Products', drawerItemStyle: { display: 'none' } }}
      >
        {() => (
          <AuthGuard fallbackToLogin={true}>
            <ProductListScreen />
          </AuthGuard>
        )}
      </Drawer.Screen>

      <Drawer.Screen
        name="TestError"
        component={TestErrorScreen}
        options={{
          title: 'Test Error',
          drawerItemStyle: { display: 'none' }, // Sembunyikan dari drawer
        }}
      />

    </Drawer.Navigator>
  );
};

export default DrawerNavigator;