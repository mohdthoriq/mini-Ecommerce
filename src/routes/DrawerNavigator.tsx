import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useDrawerLock } from '.';
import CustomDrawerContent from '../components/CustomDrawerContent';
import MainTabsNavigator from './BottomTabsNavigator';
import Settings from '../screens/settings/Setting';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const { drawerLocked } = useDrawerLock();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'left',
        drawerType: 'front',
        swipeEnabled: !drawerLocked,
        headerShown: false,
      }}
    >
      <Drawer.Screen 
        name="Main" 
        component={MainTabsNavigator}
        options={{
          title: 'Beranda',
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={Settings}
        options={{
          title: 'Pengaturan',
        }}
      />
    </Drawer.Navigator>
  );
}