import axios, { AxiosError } from 'axios';
import * as Keychain from 'react-native-keychain';

// 1. --- Konfigurasi Spesifik untuk API Key ---
const API_KEY_SERVICE = 'com.ecom:apiKey';
const API_KEY_USERNAME = 'api_client'; // Username statis sesuai permintaan

/**
 * Helper untuk mengelola API Key di Keychain.
 * Dibuat terpisah dari AuthContext karena ini adalah kredensial level aplikasi, bukan user.
 */
export const ApiKeychainHelper = {
  /**
   * Menyimpan API Key ke Keychain.
   * @param apiKey Kunci API yang akan disimpan.
   */
  async saveApiKey(apiKey: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(API_KEY_USERNAME, apiKey, {
        service: API_KEY_SERVICE,
      });
      console.log('✅ API Key saved to Keychain successfully.');
    } catch (error) {
      console.error('❌ Error saving API Key to Keychain:', error);
      throw new Error('Could not save API Key.');
    }
  },

  /**
   * Mengambil API Key dari Keychain.
   * @returns API Key atau null jika tidak ditemukan.
   */
  async getApiKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: API_KEY_SERVICE,
      });
      if (credentials) {
        console.log('✅ API Key retrieved from Keychain.');
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('❌ Error retrieving API Key from Keychain:', error);
      return null;
    }
  },
};

// 2. --- Fungsi untuk Setup dan Penyimpanan API Key ---

/**
 * Fungsi ini dijalankan sekali saat aplikasi dimulai untuk memastikan
 * API Key rahasia tersimpan dengan aman di Keychain.
 */
export const setupAndStoreApiKey = async () => {
  const staticApiKey = 'API_KEY_SECRET_XYZ'; // Kunci API rahasia Anda

  // Cek apakah key sudah ada untuk menghindari penulisan berulang
  const existingKey = await ApiKeychainHelper.getApiKey();
  if (!existingKey) {
    console.log('🔑 API Key not found in Keychain, saving now...');
    await ApiKeychainHelper.saveApiKey(staticApiKey);
  } else {
    console.log('🔑 API Key already exists in Keychain.');
  }
};

// 3. --- Konfigurasi Instance Axios dengan Interceptor ---

const apiClient = axios.create({
  baseURL: 'https://api.yourecommerce.com/v1', // Ganti dengan URL API Anda
  timeout: 10000, // 10 detik timeout
});

// Request Interceptor: Menambahkan API Key ke setiap request
apiClient.interceptors.request.use(
  async (config) => {
    const apiKey = await ApiKeychainHelper.getApiKey();

    if (!apiKey) {
      console.error('🚨 CRITICAL: API Key not found. Aborting request.');
      // Menghentikan request dengan melempar error simulasi 401
      return Promise.reject(new AxiosError('Unauthorized: Missing API Key.', '401'));
    }

    // Tambahkan API Key ke header
    config.headers['X-API-Key'] = apiKey;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
