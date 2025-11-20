import { Product, ApiProduct, ProductResponse } from '../../types';
import apiClient from './apiClient';
import { fetchWithRetry } from '../../utils/fetchWithRetry';

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

// Product API Service dengan Retry Mechanism
export const productApi = {
  /**
   * Get all products with optional AbortSignal and retry
   */
  getAllProducts: async (signal?: AbortSignal): Promise<Product[]> => {
    return fetchWithRetry(
      async () => {
        try {
          const config = signal ? { signal } : undefined;
          const response = await apiClient.get<ProductResponse>('/products', config);
          const apiProducts = response.data.products;
          
          return apiProducts.map(convertApiProduct);
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('Request was aborted');
            throw error; // Don't retry aborted requests
          }
          throw new Error('Failed to fetch products');
        }
      },
      { 
        maxRetry: 3, 
        baseDelay: 500,
        retryOn5xx: true 
      }
    );
  },

  /**
   * Get popular products (high discount or popular brands) with retry
   */
  getPopularProducts: async (limit: number = 12, signal?: AbortSignal): Promise<Product[]> => {
    return fetchWithRetry(
      async () => {
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
      { 
        maxRetry: 3, 
        baseDelay: 500 
      }
    );
  },

  /**
   * Get new products (high rating or high stock) with retry
   */
  getNewProducts: async (limit: number = 12, signal?: AbortSignal): Promise<Product[]> => {
    return fetchWithRetry(
      async () => {
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
      { 
        maxRetry: 3, 
        baseDelay: 500 
      }
    );
  },

  /**
   * Get discounted products with retry
   */
  getDiscountedProducts: async (minDiscount: number = 10, limit: number = 12, signal?: AbortSignal): Promise<Product[]> => {
    return fetchWithRetry(
      async () => {
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
      { 
        maxRetry: 3, 
        baseDelay: 500 
      }
    );
  },

  /**
   * Get products by category with retry
   */
  getProductsByCategory: async (category: string, signal?: AbortSignal): Promise<Product[]> => {
    return fetchWithRetry(
      async () => {
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
      { 
        maxRetry: 3, 
        baseDelay: 500 
      }
    );
  },

  /**
   * Get single product by ID with retry
   */
  getProductById: async (id: string, signal?: AbortSignal): Promise<Product> => {
    return fetchWithRetry(
      async () => {
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
      { 
        maxRetry: 3, 
        baseDelay: 500 
      }
    );
  },

  /**
   * Search products by query with retry
   */
  searchProducts: async (query: string, signal?: AbortSignal): Promise<Product[]> => {
    return fetchWithRetry(
      async () => {
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
      { 
        maxRetry: 3, 
        baseDelay: 500 
      }
    );
  },

  /**
   * Get all categories with retry
   */
  getCategories: async (signal?: AbortSignal): Promise<string[]> => {
    return fetchWithRetry(
      async () => {
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
      },
      { 
        maxRetry: 3, 
        baseDelay: 500 
      }
    );
  }
};

export default productApi;