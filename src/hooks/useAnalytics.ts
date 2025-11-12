// hooks/useAnalytics.ts - Untuk screen history
import { useState, useRef } from 'react';
import { NavigationState } from '@react-navigation/native';

export const useAnalytics = () => {
  const [screenHistory, setScreenHistory] = useState<string[]>([]);
  const routeNameRef = useRef<string>('');

  const trackNavigation = (state: NavigationState | undefined) => {
    if (!state) return;

    const previousRouteName = routeNameRef.current;
    const currentRouteName = getActiveRouteName(state);

    if (previousRouteName !== currentRouteName) {
      // Update screen history
      setScreenHistory(prev => [...prev, currentRouteName]);
      
      // Log analytics
      console.log(`📊 [ANALYTICS] Navigation Event:`);
      console.log(`   🎯 Current: ${currentRouteName}`);
      console.log(`   📈 History: ${screenHistory.join(' → ')}`);
      console.log(`   🕐 Timestamp: ${new Date().toLocaleTimeString()}`);
    }

    routeNameRef.current = currentRouteName;
  };

  const getActiveRouteName = (state: NavigationState): string => {
    const route = state.routes[state.index];
    
    if (route.state) {
      return getActiveRouteName(route.state as NavigationState);
    }
    
    return route.name;
  };

  return {
    trackNavigation,
    screenHistory,
    getActiveRouteName,
  };
};