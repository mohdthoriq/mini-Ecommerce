import axios from 'axios';
import { LoginForm, ApiResponse } from '../../types';

const api = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor untuk transform response
api.interceptors.response.use(
  (response) => {
    console.log('📥 [AXIOS-INTERCEPTOR] Raw response received:', {
      status: response.status,
      data: response.data
    });

    if (response.status === 200) {
      console.log('✅ [AXIOS-INTERCEPTOR] Status 200 OK - Transforming response...');
      
      const transformedData = {
        ...response,
        data: {
          success: true,
          token: response.data.token || 'simulated_token_xyz',
          user: response.data,
          message: 'Login successful'
        }
      };

      console.log('🔄 [AXIOS-INTERCEPTOR] Transformed response:', {
        success: transformedData.data.success,
        token: transformedData.data.token ? '***' + transformedData.data.token.slice(-8) : 'none'
      });

      if (transformedData.data.token) {
        console.log('🔐 [AXIOS-INTERCEPTOR] TOKEN RECEIVED:', transformedData.data.token);
      }

      return transformedData;
    }

    return response;
  },
  (error) => {
    console.error('❌ [AXIOS-INTERCEPTOR] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginForm): Promise<ApiResponse> => {
    try {
      console.log('🚀 [AUTH-API] Starting login...');

      const username = credentials.username.trim();
      
      if (!username) {
        throw new Error('Username is required for DummyJSON');
      }

      const requestData = {
        username: username,
        password: credentials.password.trim()
      };

      console.log('📤 [AUTH-API] Sending to DummyJSON:', {
        username: requestData.username,
        passwordLength: requestData.password.length
      });

      if (!requestData.username || !requestData.password) {
        throw new Error('Username and password are required');
      }

      console.log('🌐 [AUTH-API] Making POST request...');
      
      const response = await api.post('/auth/login', requestData);
      
      console.log('✅ [AUTH-API] Response received after interceptor:', response.data);

      return response.data;

    } catch (error: any) {
      console.error('❌ [AUTH-API] Login error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      throw new Error(`DummyJSON API Error: ${error.response?.data?.message || error.message}`);
    }
  },
};

export default api;