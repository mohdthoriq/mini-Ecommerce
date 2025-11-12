// contexts/DrawerLockContext.js
import React, { createContext, useState, ReactNode } from 'react';

interface DrawerLockContextType {
  drawerLockMode: 'unlocked' | 'locked-closed' | 'locked-open';
  setDrawerLockMode: (mode: 'unlocked' | 'locked-closed' | 'locked-open') => void;
}

export const DrawerLockContext = createContext<DrawerLockContextType>({
  drawerLockMode: 'unlocked',
  setDrawerLockMode: () => {},
});

export const DrawerLockProvider = ({ children }: { children: ReactNode }) => {
  const [drawerLockMode, setDrawerLockMode] = useState<'unlocked' | 'locked-closed' | 'locked-open'>('unlocked');

  return (
    <DrawerLockContext.Provider value={{ drawerLockMode, setDrawerLockMode }}>
      {children}
    </DrawerLockContext.Provider>
  );
};