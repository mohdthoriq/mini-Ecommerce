import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import DrawerNavigator from './DrawerNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type DrawerLockContextType = {
  drawerLocked: boolean;
  setDrawerLocked: (locked: boolean) => void;
};

const DrawerLockContext = createContext<DrawerLockContextType>({
  drawerLocked: true,
  setDrawerLocked: () => { },
});

export const useDrawerLock = () => useContext(DrawerLockContext);

export default function Navigation() {
  const [drawerLocked, setDrawerLocked] = useState(true);

  return (
    <SafeAreaProvider>
      <DrawerLockContext.Provider value={{ drawerLocked, setDrawerLocked }}>
        <NavigationContainer>
          <DrawerNavigator />
        </NavigationContainer>
      </DrawerLockContext.Provider>
    </SafeAreaProvider>
  );
}