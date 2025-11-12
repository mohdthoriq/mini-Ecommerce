// navigation/AnalyticsNavigationContainer.tsx
import React, { useRef } from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { addAnalyticsEvent } from '../screens/dashboard/AnalyticsHistory';

interface AnalyticsNavigationContainerProps {
  children: React.ReactNode;
}

const AnalyticsNavigationContainer: React.FC<AnalyticsNavigationContainerProps> = ({ children }) => {
  const routeNameRef = useRef<string>('');
  const navigationRef = useRef<any>(null);

  const getActiveRouteName = (state: NavigationState): string => {
    const route = state.routes[state.index];
    
    if (route.state) {
      return getActiveRouteName(route.state as NavigationState);
    }
    
    return route.name;
  };

  const onStateChange = (state: NavigationState | undefined) => {
    if (!state) return;

    const previousRouteName = routeNameRef.current;
    const currentRouteName = getActiveRouteName(state);

    if (previousRouteName !== currentRouteName) {
      addAnalyticsEvent(currentRouteName, previousRouteName);
    }

    routeNameRef.current = currentRouteName;
  };

  const onReady = () => {
    const rootState = navigationRef.current?.getRootState();
    if (rootState) {
      routeNameRef.current = getActiveRouteName(rootState);
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={onStateChange}
    >
      {children}
    </NavigationContainer>
  );
};

export default AnalyticsNavigationContainer;