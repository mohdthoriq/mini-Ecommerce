// src/services/api/productApi.ts
import { Product, ApiProduct, ProductResponse } from '../../types';
import apiClient from './apiClient';


// Convert API product to our Product interface
const convertApiProduct = (apiProduct: ApiProduct): Product => {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.title,
    price: apiProduct.price,
    category: apiProduct.category,
    description: apiProduct.description,
    image: apiProduct.thumbnail,
    discount: apiProduct.discountPercentage,
    isNew: apiProduct.rating > 4.5 || apiProduct.stock > 50,
    stock: apiProduct.stock
  };
};

// Product API Service
export const productApi = {
  /**
   * Get all products with optional AbortSignal
   */
  getAllProducts: async (signal?: AbortSignal): Promise<Product[]> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<ProductResponse>('/products', config);
      const apiProducts = response.data.products;
      
      return apiProducts.map(convertApiProduct);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error('Failed to fetch products');
    }
  },

  /**
   * Get popular products (high discount or popular brands)
   */
  getPopularProducts: async (limit: number = 12, signal?: AbortSignal): Promise<Product[]> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<ProductResponse>('/products', config);
      const apiProducts = response.data.products;
      
      const convertedProducts = apiProducts.map(convertApiProduct);
      
      // Filter popular products
      const popularProducts = convertedProducts
        .filter(product => 
          (product.discount && product.discount > 15) || // Good discount
          product.name.toLowerCase().includes('iphone') ||
          product.name.toLowerCase().includes('samsung') ||
          product.name.toLowerCase().includes('macbook')
        )
        .slice(0, limit);
      
      return popularProducts;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error('Failed to fetch popular products');
    }
  },

  /**
   * Get new products (high rating or high stock)
   */
  getNewProducts: async (limit: number = 12, signal?: AbortSignal): Promise<Product[]> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<ProductResponse>('/products', config);
      const apiProducts = response.data.products;
      
      const convertedProducts = apiProducts.map(convertApiProduct);
      
      // Filter new products
      const newProducts = convertedProducts
        .filter(product => product.isNew)
        .slice(0, limit);
      
      return newProducts;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error('Failed to fetch new products');
    }
  },

  /**
   * Get discounted products
   */
  getDiscountedProducts: async (minDiscount: number = 10, limit: number = 12, signal?: AbortSignal): Promise<Product[]> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<ProductResponse>('/products', config);
      const apiProducts = response.data.products;
      
      const convertedProducts = apiProducts.map(convertApiProduct);
      
      // Filter discounted products
      const discountedProducts = convertedProducts
        .filter(product => product.discount && product.discount >= minDiscount)
        .slice(0, limit);
      
      return discountedProducts;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error('Failed to fetch discounted products');
    }
  },

  /**
   * Get products by category
   */
  getProductsByCategory: async (category: string, signal?: AbortSignal): Promise<Product[]> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<ProductResponse>(`/products/category/${category}`, config);
      const apiProducts = response.data.products;
      
      return apiProducts.map(convertApiProduct);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error(`Failed to fetch products for ${category}`);
    }
  },

  /**
   * Get single product by ID
   */
  getProductById: async (id: string, signal?: AbortSignal): Promise<Product> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<ApiProduct>(`/products/${id}`, config);
      return convertApiProduct(response.data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error('Failed to fetch product');
    }
  },

  /**
   * Search products by query
   */
  searchProducts: async (query: string, signal?: AbortSignal): Promise<Product[]> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<ProductResponse>(`/products/search?q=${query}`, config);
      const apiProducts = response.data.products;
      
      return apiProducts.map(convertApiProduct);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error('Failed to search products');
    }
  },

  /**
   * Get all categories
   */
  getCategories: async (signal?: AbortSignal): Promise<string[]> => {
    try {
      const config = signal ? { signal } : undefined;
      const response = await apiClient.get<string[]>('/products/categories', config);
      return response.data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        throw error;
      }
      throw new Error('Failed to fetch categories');
    }
  }
};

export default productApi;