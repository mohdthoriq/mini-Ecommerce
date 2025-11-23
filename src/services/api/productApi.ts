// services/api/productApi.ts - FIXED FOR DUMMYJSON
import { Product, ApiProduct, ProductResponse } from '../../types';
import apiClient from './apiClient';

// Enhanced mock data yang match dengan dummyjson structure
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 9',
    price: 549,
    category: 'smartphones',
    description: 'An apple mobile which is nothing like apple',
    image: 'https://cdn.dummyjson.com/product-images/1/thumbnail.jpg',
    discount: 12.96,
    isNew: true,
    stock: 94,
    rating: 4.69,
    brand: 'Apple',
  },
  {
    id: '2',
    name: 'iPhone X',
    price: 899,
    category: 'smartphones',
    description: 'SIM-Free, Model A19211 6.5-inch Super Retina HD display with OLED technology',
    image: 'https://cdn.dummyjson.com/product-images/2/thumbnail.jpg',
    discount: 17.94,
    isNew: false,
    stock: 34,
    rating: 4.44,
    brand: 'Apple',
  },
  {
    id: '3',
    name: 'Samsung Universe 9',
    price: 1249,
    category: 'smartphones',
    description: 'Samsung\'s new variant which goes beyond Galaxy to the Universe',
    image: 'https://cdn.dummyjson.com/product-images/3/thumbnail.jpg',
    discount: 15.46,
    isNew: true,
    stock: 36,
    rating: 4.09,
    brand: 'Samsung',
  },
  {
    id: '4',
    name: 'OPPOF19',
    price: 280,
    category: 'smartphones',
    description: 'OPPO F19 is officially announced on April 2021.',
    image: 'https://cdn.dummyjson.com/product-images/4/thumbnail.jpg',
    discount: 17.91,
    isNew: false,
    stock: 123,
    rating: 4.3,
    brand: 'OPPO',
  }
];

const convertApiProduct = (apiProduct: ApiProduct): Product => {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.title,
    price: apiProduct.price,
    category: apiProduct.category,
    description: apiProduct.description,
    image: apiProduct.thumbnail,
    discount: apiProduct.discountPercentage || 0,           
    isNew: (apiProduct.rating > 4.5) || (apiProduct.stock > 50), 
    stock: apiProduct.stock || 0,                          
    rating: apiProduct.rating || 0,                        
    brand: apiProduct.brand,
  };
};

// Simple fallback function
const getFallbackProducts = (limit: number = 4): Product[] => {
  console.log('🔄 [PRODUCT API] Using fallback mock data');
  return mockProducts.slice(0, limit);
};

// Product API Service yang sudah disesuaikan dengan dummyjson
export const productApi = {
  /**
   * Get all products dari dummyjson
   */
  getAllProducts: async (signal?: AbortSignal): Promise<Product[]> => {
    try {
      console.log('📦 [PRODUCT API] Fetching all products from dummyjson...');

      const config = signal ? { signal } : {};
      const response = await apiClient.get<ProductResponse>('/products', config);

      console.log('✅ [PRODUCT API] Raw API response:', {
        total: response.data.total,
        limit: response.data.limit,
        productsCount: response.data.products.length
      });

      if (!response.data?.products) {
        throw new Error('Invalid API response format - no products array');
      }

      const products = response.data.products.map(convertApiProduct);
      console.log(`✅ [PRODUCT API] Successfully converted ${products.length} products`);

      return products;
    } catch (error: any) {
      console.error('❌ [PRODUCT API] getAllProducts failed:', {
        message: error.message,
        status: error.response?.status
      });

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      return getFallbackProducts(8);
    }
  },

  /**
   * Get popular products dari dummyjson
   * - High rating products (> 4.5)
   * - Good discount (> 15%)
   * - Popular brands (Apple, Samsung, etc.)
   */
  // services/api/productApi.ts - FIX ALL METHODS

  getPopularProducts: async (limit: number = 4, signal?: AbortSignal): Promise<Product[]> => {
    try {
      console.log(`📦 [PRODUCT API] Fetching ${limit} popular products...`);

      const config = signal ? { signal } : {};
      const response = await apiClient.get<ProductResponse>('/products', config);

      if (!response.data?.products) {
        throw new Error('Invalid API response format');
      }

      const allProducts = response.data.products.map(convertApiProduct);
      console.log(`📊 [PRODUCT API] Total products available: ${allProducts.length}`);

      // ✅ SAFE ACCESS WITH NULLISH COALESCING
      const popularProducts = allProducts
        .filter(product =>
          (product.rating ?? 0) > 4.5 ||                    
          (product.discount ?? 0) > 15 ||                   
          ['apple', 'samsung', 'huawei', 'oppo'].includes(product.brand?.toLowerCase() || '') ||
          (product.stock ?? 0) > 90                        
        )
        .slice(0, limit);

      console.log(`✅ [PRODUCT API] Found ${popularProducts.length} popular products`);

      // ✅ SAFE SORT
      if (popularProducts.length < limit) {
        const fallbackProducts = allProducts
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)) // ✅ SAFE
          .slice(0, limit);
        console.log(`🔄 [PRODUCT API] Using top-rated products as fallback`);
        return fallbackProducts;
      }

      return popularProducts;

    } catch (error: any) {
      console.error('❌ [PRODUCT API] Popular products fetch failed:', error.message);

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      return getFallbackProducts(limit);
    }
  },

  getNewProducts: async (limit: number = 4, signal?: AbortSignal): Promise<Product[]> => {
    try {
      console.log(`📦 [PRODUCT API] Fetching ${limit} new products...`);

      const config = signal ? { signal } : {};
      const response = await apiClient.get<ProductResponse>('/products', config);

      if (!response.data?.products) {
        throw new Error('Invalid API response format');
      }

      const allProducts = response.data.products.map(convertApiProduct);

      // ✅ SAFE ACCESS
      const newProducts = allProducts
        .filter(product => (product.rating ?? 0) > 4.4) // ✅ SAFE
        .slice(0, limit);

      console.log(`✅ [PRODUCT API] Returning ${newProducts.length} new products`);
      return newProducts;

    } catch (error: any) {
      console.error('❌ [PRODUCT API] New products fetch failed:', error.message);

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      return getFallbackProducts(limit);
    }
  },

  getDiscountedProducts: async (minDiscount: number = 15, limit: number = 4, signal?: AbortSignal): Promise<Product[]> => {
    try {
      console.log(`📦 [PRODUCT API] Fetching products with discount > ${minDiscount}%...`);

      const config = signal ? { signal } : {};
      const response = await apiClient.get<ProductResponse>('/products', config);

      if (!response.data?.products) {
        throw new Error('Invalid API response format');
      }

      const allProducts = response.data.products.map(convertApiProduct);

      // ✅ SAFE ACCESS
      const discountedProducts = allProducts
        .filter(product => (product.discount ?? 0) >= minDiscount) // ✅ SAFE
        .slice(0, limit);

      console.log(`✅ [PRODUCT API] Found ${discountedProducts.length} discounted products`);
      return discountedProducts;

    } catch (error: any) {
      console.error('❌ [PRODUCT API] Discounted products fetch failed:', error.message);

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      return getFallbackProducts(limit).map(product => ({
        ...product,
        discount: Math.max(product.discount ?? 0, minDiscount) // ✅ SAFE
      }));
    }
  },

  /**
   * Get products by category
   */
  getProductsByCategory: async (category: string, signal?: AbortSignal): Promise<Product[]> => {
    try {
      console.log(`📦 [PRODUCT API] Fetching products for category: ${category}`);

      const config = signal ? { signal } : {};
      const response = await apiClient.get<ProductResponse>(`/products/category/${category}`, config);

      if (!response.data?.products) {
        throw new Error('Invalid API response format');
      }

      const products = response.data.products.map(convertApiProduct);
      console.log(`✅ [PRODUCT API] Found ${products.length} products in ${category}`);
      return products;

    } catch (error: any) {
      console.error(`❌ [PRODUCT API] Category ${category} fetch failed:`, error.message);

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      // Filter mock products by category
      return getFallbackProducts(8).filter(product =>
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }
  },

  /**
   * Get single product by ID
   */
  getProductById: async (id: string, signal?: AbortSignal): Promise<Product> => {
    try {
      console.log(`📦 [PRODUCT API] Fetching product ${id}...`);

      const config = signal ? { signal } : {};
      const response = await apiClient.get<ApiProduct>(`/products/${id}`, config);

      const product = convertApiProduct(response.data);
      console.log(`✅ [PRODUCT API] Product fetched:`, product.name);
      return product;

    } catch (error: any) {
      console.error(`❌ [PRODUCT API] Product ${id} fetch failed:`, error.message);

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      // Find in mock data
      const fallbackProduct = mockProducts.find(p => p.id === id) || mockProducts[0];
      return fallbackProduct;
    }
  },

  /**
   * Search products by query
   */
  searchProducts: async (query: string, signal?: AbortSignal): Promise<Product[]> => {
    try {
      console.log(`🔍 [PRODUCT API] Searching products: "${query}"`);

      const config = signal ? { signal } : {};
      const response = await apiClient.get<ProductResponse>(`/products/search?q=${encodeURIComponent(query)}`, config);

      if (!response.data?.products) {
        throw new Error('Invalid API response format');
      }

      const products = response.data.products.map(convertApiProduct);
      console.log(`✅ [PRODUCT API] Search found ${products.length} products for "${query}"`);
      return products;

    } catch (error: any) {
      console.error(`❌ [PRODUCT API] Search failed for "${query}":`, error.message);

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      // Search in mock data
      return mockProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.brand?.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  /**
   * Get all categories
   */
  getCategories: async (signal?: AbortSignal): Promise<string[]> => {
    try {
      console.log('📦 [PRODUCT API] Fetching categories...');

      const config = signal ? { signal } : {};
      const response = await apiClient.get<string[]>('/products/categories', config);

      console.log(`✅ [PRODUCT API] Found ${response.data.length} categories`);
      return response.data;

    } catch (error: any) {
      console.error('❌ [PRODUCT API] Categories fetch failed:', error.message);

      if (error.name === 'AbortError') {
        console.log('⏹️ [PRODUCT API] Request aborted');
        throw error;
      }

      // Return unique categories from mock data
      return Array.from(new Set(mockProducts.map(p => p.category)));
    }
  },

  /**
   * Test API connection dengan endpoint yang sederhana
   */
  testApiConnection: async (): Promise<boolean> => {
    try {
      console.log('🔍 [PRODUCT API] Testing API connection to dummyjson...');
      const response = await apiClient.get('/products/1');
      console.log('✅ [PRODUCT API] API connection test successful');
      return true;
    } catch (error: any) {
      console.error('❌ [PRODUCT API] API connection test failed:', {
        message: error.message,
        status: error.response?.status,
        code: error.code
      });
      return false;
    }
  }
};

export default productApi;