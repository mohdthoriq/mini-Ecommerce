import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../../types';

// Create axios instance dengan base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data ? { ...config.data } : 'no data'
    });
    return config;
  },
  (error) => {
    console.error('❌ [API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
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

    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          error.message = data?.message || 'Bad request';
          break;
        case 404:
          error.message = data?.message || 'Resource not found';
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

export default apiClient;