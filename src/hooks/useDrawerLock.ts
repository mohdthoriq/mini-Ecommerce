// hooks/useDrawerLock.ts
import { useNavigationState } from '@react-navigation/native';

export const useDrawerLock = () => {
  // Gunakan try-catch untuk handle error
  try {
    const currentRoute = useNavigationState(state => {
      if (!state) {
        console.log('❌ No navigation state available');
        return 'Unknown';
      }
      
      const route = state.routes[state.index];
      
      // Jika ada nested navigator, cek route yang paling dalam
      if (route.state) {
        return getDeepestRoute(route.state);
      }
      
      return route.name;
    });

    // ✅ SCREEN YANG HARUS DI-LOCK (TERLEPAS DARI SETTINGS)
    const lockedScreens = ['ProductDetail', 'CheckoutModal'];
    const shouldLockDrawer = lockedScreens.includes(currentRoute);

    console.log('🔒 Current Route:', currentRoute, 'Locked:', shouldLockDrawer);

    return {
      shouldLockDrawer,
      drawerLockMode: shouldLockDrawer ? 'locked-closed' : 'unlocked' as const,
    };
  } catch (error) {
    console.log('⚠️ useDrawerLock error:', error);
    // Fallback jika hook tidak bisa mengakses navigation state
    return {
      shouldLockDrawer: false,
      drawerLockMode: 'unlocked' as const,
    };
  }
};

// Helper function untuk mendapatkan route paling dalam
const getDeepestRoute = (navigationState: any): string => {
  if (navigationState.routes) {
    const route = navigationState.routes[navigationState.index];
    if (route.state) {
      return getDeepestRoute(route.state);
    }
    return route.name;
  }
  return navigationState.routeName || navigationState.name;
};