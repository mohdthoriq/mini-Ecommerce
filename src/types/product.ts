// types/product.ts
export interface Product {
  id: string;
  name: string;
  title: string;
  price: number;
  category: string;
  description: string;
  image: string;
  isNew?: boolean;
  rating?: number;
  discount?: number;
  stock?: number;
  brand?: string; // Tambahkan brand sebagai optional
  thumbnail?: string; // Tambahkan thumbnail sebagai optional
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

// Untuk API dummyjson.com (jika perlu)
export interface ApiProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

export interface ProductResponse {
  products: ApiProduct[];
  total: number;
  skip: number;
  limit: number;
}