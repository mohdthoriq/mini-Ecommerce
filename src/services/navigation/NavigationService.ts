// services/navigation/NavigationService.ts
import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';

export const navigationRef = createRef<NavigationContainerRef<any>>();

export const NavigationService = {
  navigate: (name: string, params?: any) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    } else {
      console.warn('NavigationService: navigationRef not ready');
    }
  },
  
  goBack: () => {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  },
  
  reset: (state: any) => {
    if (navigationRef.current) {
      navigationRef.current.reset(state);
    }
  }
};