// src/api/apiClient.ts
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';
import { ApiResponse } from '../../types';

// Konfigurasi Keychain untuk API Key
const API_KEYCHAIN_CONFIG = {
  service: 'com.ecom.apiKey', // Namespace berbeda dari user token
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

// API Key statis aplikasi (ganti dengan API Key sebenarnya)
const APP_API_KEY = 'ek_yourapp_987654321abcdef1234567890';

// Helper untuk mengelola API Key di Keychain
const ApiKeychainHelper = {
  async saveApiKey(apiKey: string): Promise<void> {
    try {
      if (!apiKey) {
        throw new Error('API Key cannot be empty');
      }

      const result = await Keychain.setGenericPassword(
        'appApiKey',
        apiKey,
        API_KEYCHAIN_CONFIG
      );

      if (!result) {
        throw new Error('Failed to save API Key to Keychain');
      }

      console.log('✅ API Key saved to Keychain successfully');
    } catch (error) {
      console.error('❌ Error saving API Key to Keychain:', error);
      throw error;
    }
  },

  async getApiKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword(API_KEYCHAIN_CONFIG);
      
      if (credentials && credentials.password) {
        console.log('✅ API Key retrieved from Keychain');
        return credentials.password;
      }
      
      console.log('ℹ️ No API Key found in Keychain');
      return null;
    } catch (error) {
      console.error('❌ Error retrieving API Key from Keychain:', error);
      return null;
    }
  },

  async deleteApiKey(): Promise<void> {
    try {
      await Keychain.resetGenericPassword(API_KEYCHAIN_CONFIG);
      console.log('✅ API Key removed from Keychain');
    } catch (error) {
      console.error('❌ Error removing API Key from Keychain:', error);
    }
  },

  async hasApiKey(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword(API_KEYCHAIN_CONFIG);
      return !!credentials && !!credentials.password;
    } catch (error) {
      console.error('Error checking API Key in Keychain:', error);
      return false;
    }
  }
};

// Setup API Key saat aplikasi pertama kali dijalankan
export const setupAndStoreApiKey = async (): Promise<void> => {
  try {
    console.log('🔧 Setting up API Key...');
    
    const hasExistingApiKey = await ApiKeychainHelper.hasApiKey();
    
    if (hasExistingApiKey) {
      console.log('✅ API Key already exists in Keychain');
      return;
    }

    await ApiKeychainHelper.saveApiKey(APP_API_KEY);
    console.log('🎯 API Key setup completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to setup API Key:', error);
    throw error;
  }
};

// Create axios instance dengan base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://dummyjson.com', // Tetap menggunakan base URL yang ada
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced Request interceptor dengan API Key
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Tambahkan API Key ke header untuk semua request
      const apiKey = await ApiKeychainHelper.getApiKey();
      
      if (apiKey && config.headers) {
        config.headers['X-API-Key'] = apiKey;
      }

      console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: {
          ...config.headers,
          'X-API-Key': apiKey ? '***' + apiKey.slice(-4) : 'MISSING' // Log partial untuk security
        },
        data: config.data ? { ...config.data } : 'no data'
      });

      return config;
    } catch (error) {
      console.error('❌ [API] Request Interceptor Error:', error);
      return config; // Tetap lanjutkan request meski ada error di interceptor
    }
  },
  (error) => {
    console.error('❌ [API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor (tetap sama dengan enhancement)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ [API] ${response.status} ${response.config.url}`, {
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ [API] Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Enhanced error handling dengan API Key specific errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          error.message = data?.message || 'Invalid API Key or unauthorized access';
          error.isApiKeyError = true;
          break;
        case 403:
          error.message = data?.message || 'API Key rejected or insufficient permissions';
          error.isApiKeyError = true;
          break;
        case 400:
          error.message = data?.message || 'Bad request';
          break;
        case 404:
          error.message = data?.message || 'Resource not found';
          break;
        case 429:
          error.message = 'API rate limit exceeded';
          break;
        case 500:
          error.message = 'Internal server error';
          break;
        default:
          error.message = data?.message || `Request failed with status ${status}`;
      }
    } else if (error.request) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Export helper functions
export const apiKeyHelper = ApiKeychainHelper;

// Utility functions untuk API calls (optional, untuk konsistensi)
export const apiUtils = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
};

export default apiClient;