import { NavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export const resetStackAndCloseDrawer = (navigation: NavigationProp<any>) => {
  // Reset stack ke initial route
  navigation.reset({
    index: 0,
    routes: [{ name: 'TopTabs' }],
  });

  // Tutup drawer
  const parent = navigation.getParent<DrawerNavigationProp<{}>>();
  if (parent?.closeDrawer) {
    parent.closeDrawer();
  }
};

export const navigateToParentDrawer = (navigation: NavigationProp<any>) => {
  const parent = navigation.getParent();
  if (parent) {
    parent.goBack();
  }
};

export const getCurrentRouteName = (navigation: any): string => {
  const state = navigation.getState();
  const route = state.routes[state.index];
  return route.name;
};

export const isDrawerOpen = (navigation: any): boolean => {
  const state = navigation.getState();
  return state.history.some((entry: any) => entry.type === 'drawer');
};

// Auth navigation utilities
export const navigateToAuth = (navigation: any) => {
  navigation.reset({
    index: 0,
    routes: [{ name: 'Auth' }],
  });
};

export const navigateToMainApp = (navigation: any) => {
  navigation.reset({
    index: 0,
    routes: [{ name: 'RootDrawer' }],
  });
};