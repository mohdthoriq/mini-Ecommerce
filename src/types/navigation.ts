// types/navigation.ts
import { Product } from './product';

// Root Stack Navigator Types
export type RootStackParamList = {
  RootDrawer: undefined;
  CategoriesWithBottomTabs: undefined;
  ProductDetail: { productId: string };
  ProductList: undefined
  Profile: undefined;
  Biometric: undefined;
  Login: undefined;
  KTPupload: undefined;
};

export type RootDrawerParamList = {
  Home: undefined;
  CategoriesWithBottomTabs: undefined;
  Cart: undefined;
  Analytics: undefined;
  Profile: { userId?: string };
  Settings: undefined;
  CategoryList: undefined;
  Login: undefined;
  Biometric: undefined;
  KTPupload: undefined;
  ProductCategory: { category: string };
  ProductList: undefined;
  ProductDetail: { productId: string }; 
  CheckoutModal: undefined;
  TestError: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  CategoriesWithBottomTabs: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Biometric: undefined;
  ProductList: undefined;
  Profile: undefined;
  Login: undefined;
  KTPupload: undefined;
  TestError: undefined;
  CheckoutModal: { 
        product?: Product; // Untuk checkout single product
        cartItems?: CartItem[]; // Untuk checkout dari cart
        subtotal?: number;
        discount?: number;
        shippingFee?: number;
        tax?: number;
        total?: number;
    };
};

export type BottomTabsParamList = {
  Home: undefined;
  CategoriesTopTabs: undefined;
  Analytics: undefined;
  Profile: undefined;
  Login: undefined;
};

export type TopTabsParamList = {
  Popular: undefined;
  New: undefined;
  Discount: undefined;
  Electronics: undefined;
  Clothing: undefined;
  Food: undefined;
  Automotive: undefined;
  Entertainment: undefined;
  Baby: undefined;
};

export interface CartItem {
    product: Product;
    quantity: number;
    id: string;
}