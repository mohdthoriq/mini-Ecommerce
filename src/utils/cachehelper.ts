import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheData<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheManager {
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Save data to cache with TTL
  async set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): Promise<void> {
    try {
      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`💾 Cache saved for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error saving cache for key ${key}:`, error);
    }
  }

  // Get data from cache if not expired
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheData: CacheData<T> = JSON.parse(cached);
      const now = Date.now();
      const isExpired = now - cacheData.timestamp > cacheData.ttl;

      if (isExpired) {
        console.log(`⏰ Cache expired for key: ${key}`);
        await this.remove(key); // Clean up expired cache
        return null;
      }

      console.log(`📖 Cache hit for key: ${key}`);
      return cacheData.data;
    } catch (error) {
      console.error(`❌ Error reading cache for key ${key}:`, error);
      return null;
    }
  }

  // Remove specific cache
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cache removed for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error removing cache for key ${key}:`, error);
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('🧹 All cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  // Check if cache is valid without removing it
  async isValid(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return false;

      const cacheData: CacheData<any> = JSON.parse(cached);
      const now = Date.now();
      return now - cacheData.timestamp <= cacheData.ttl;
    } catch (error) {
      console.error(`❌ Error checking cache validity for key ${key}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();