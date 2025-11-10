import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useWindowDimensions } from 'react-native';
import Popular from '../screens/categories/Popular';
import New from '../screens/categories/New';
import Discount from '../screens/categories/Discount';
import Electronics from '../screens/categories/Electronics';
import Clothing from '../screens/categories/Clothing';
import Food from '../screens/categories/Food';
import Automotive from '../screens/categories/Automotive';
import Entertainment from '../screens/categories/Entertainment';
import Baby from '../screens/categories/Baby';

const TopTabs = createMaterialTopTabNavigator();

export default function TopTabsNavigator() {
  const { width } = useWindowDimensions();

  return (
    <TopTabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          textTransform: 'none',
          includeFontPadding: false,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#2196F3',
          height: 3,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarScrollEnabled: true,
        // 🔥 HAPUS tabBarItemStyle DENGAN FIXED WIDTH
        lazy: true,
        lazyPreloadDistance: 1,
      }}
    >
      <TopTabs.Screen name="Popular" component={Popular} options={{ title: 'Populer' }} />
      <TopTabs.Screen name="New" component={New} options={{ title: 'Terbaru' }} />
      <TopTabs.Screen name="Discount" component={Discount} options={{ title: '🔥 Diskon' }} />
      <TopTabs.Screen name="Electronics" component={Electronics} options={{ title: 'Elektronik' }} />
      <TopTabs.Screen name="Clothing" component={Clothing} options={{ title: 'Pakaian' }} />
      <TopTabs.Screen name="Food" component={Food} options={{ title: 'Makanan' }} />
      <TopTabs.Screen name="Automotive" component={Automotive} options={{ title: 'Otomotif' }} />
      <TopTabs.Screen name="Entertainment" component={Entertainment} options={{ title: 'Hiburan' }} />
      <TopTabs.Screen name="Baby" component={Baby} options={{ title: 'Bayi' }} />
    </TopTabs.Navigator>
  );
}