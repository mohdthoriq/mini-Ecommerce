import { LinkingOptions } from '@react-navigation/native';
import { RootDrawerParamList } from '../types/navigation';
import { Linking } from 'react-native';

export const linkingConfig: LinkingOptions<RootDrawerParamList> = {
  prefixes: ['ecommerceapp://', 'https://ecommerceapp.com'],
  
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    console.log('📱 getInitialURL:', url);
    return url;
  },

  subscribe(listener) {
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Linking event:', url);
      listener(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  },

  config: {
    screens: {
      // ✅ Sesuaikan dengan struktur DrawerNavigator yang sebenarnya
      Home: 'home',
      Cart: 'keranjang',
      Profile: {
        path: 'profil/:userId?',
        parse: {
          userId: (userId: string) => userId || '',
        },
      },
      Analytics: 'analytics',
      Settings: 'settings',
      CategoryList: 'categories/list',
      ProductCategory: 'category/:category',
      ProductList: 'products/list',
      Login: 'login',
      // Tambahkan screen lainnya sesuai struktur Drawer
    },
  },
};