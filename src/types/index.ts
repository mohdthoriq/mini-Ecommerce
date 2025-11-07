export interface Product {
    id : string;
    name : string;
    price : number;
    imageUrl : string;
    description : string;    
}

export interface NewProduct {
    id : string;
    name : string;
    price : string;
    imageUrl : string;
    description : string;
}

export interface FormErrors {
    name? : string;
    price? : string;
    imageUrl? : string;
    description? : string;
}

export type ErrorsState = {
  [key in keyof NewProduct]?: string;
};

// 🔥 UPDATE: ProductCardProps dengan props responsive
export interface ProductCardProps {
  product: Product;
  cardWidth: number;           // Tambah prop ini
  isLandscape: boolean;        // Tambah prop ini
}

// 🔥 UPDATE: HeaderProps dengan props responsive
export interface HeaderProps {
  isLandscape?: boolean;       // Tambah prop ini  
  screenWidth?: number;        // Tambah prop ini
}

export interface AddProductButtonProps {
  isLandscape?: boolean;       // Tambah prop ini
  onPress: () => void;
}

export interface ProductFormProps {
  product: NewProduct;
  errors: FormErrors;
  onChange: (field: keyof NewProduct, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  screenHeight?: number;
  insets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

