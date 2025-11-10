export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category?: string;
  discount?: number;
  isPopular?: boolean;
  isNew?: boolean;
}

export interface NewProduct {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  description: string;
}

export interface ErrorsState {
  name?: string;
  price?: string;
  imageUrl?: string;
  description?: string;
}

export interface ProductFormProps {
  product: NewProduct;
  errors: ErrorsState;
  onChange: (field: keyof Omit<NewProduct, 'id'>, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  screenHeight: number;
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// 🔥 TAMBAHKAN TYPE UNTUK ADD PRODUCT BUTTON
export interface AddProductButtonProps {
  onPress: () => void;
  isLandscape?: boolean; // Opsional jika digunakan di ProductListScreen
}

// 🔥 TAMBAHKAN TYPE UNTUK PRODUCT CARD
export interface ProductCardProps {
  product: Product;
  cardWidth: number;
  isLandscape: boolean;
  onPress?: (product: Product) => void;
}

export type RootDrawerParamList = {
  Main: undefined;
  Settings: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Product: undefined;
  Profile: undefined;
};

export type HomeTopTabsParamList = {
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