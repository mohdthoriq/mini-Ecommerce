// DrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types';
import SettingsScreen from '../screens/settings/Setting';
import LoginScreen from '../screens/auth/Login';
import CustomDrawerContent from '../components/CustomDrawerContent';
import BottomTabsNavigator from './BottomTabsNavigator';
import HomeScreen from '../screens/dashboard/Home';
import { TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useSwipe } from '../context/SwipeContext';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

const DrawerNavigator = () => {
  const { canSwipe } = useSwipe();

  console.log('🔄 DrawerNavigator - canSwipe:', canSwipe);

  return (
    <Drawer.Navigator
      key={canSwipe ? 'swipe-enabled' : 'swipe-disabled'} // ✅ TAMBAHKAN KEY UNIK
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation, route }) => ({
        headerShown: true,
        headerTitle: 'Eco Shop',
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
        swipeEnabled: canSwipe, // ✅ LANGSUNG PAKAI BOOLEAN
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: '🏠 Home',
        }}
      />
      
      <Drawer.Screen 
        name="CategoriesWithBottomTabs" 
        component={BottomTabsNavigator}
        options={{ 
          title: '📦 Categories',
          headerShown: true,
        }}
      />
      
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: '⚙️ Settings',
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
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;