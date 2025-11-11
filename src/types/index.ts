export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  isNew?: boolean;
  discount?: number;
}

export interface NewProduct {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  description: string;
}

export type ErrorsState = {
  [key in keyof Omit<NewProduct, 'id'>]?: string;
};

// Root Stack Navigator Types
export type RootStackParamList = {
  RootDrawer: undefined;
  CategoriesWithBottomTabs: undefined;
  ProductDetail: { productId: string };
  Profile: undefined;
  Login: undefined;
};


export type RootDrawerParamList = {
  Home: undefined;
  CategoriesWithBottomTabs: undefined;
  Settings: undefined;
  Login: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
   CategoriesWithBottomTabs: undefined;
  ProductDetail: { productId: string };
  Profile: undefined;
  Login: undefined;
};

export type BottomTabsParamList = {
  Home: undefined;
  CategoriesTopTabs: undefined;
  ProfileTab: undefined;
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

export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  user?: User;
}

export interface LoginForm {
  username: string;
  email: string;
  password: string;
}