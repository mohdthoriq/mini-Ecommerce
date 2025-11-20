import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * PRODUCT CACHE SERVICE
 * Handle product detail caching dengan TTL (Time To Live)
 * Cache disimpan per item untuk optimal storage usage
 */

// Config
const CACHE_PREFIX = '@product_detail:';
const CACHE_META_KEY = '@product_cache_meta';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 menit dalam milliseconds

export interface CacheData<T> {
  value: T;
  ttl_product: number; // Timestamp expiration
}

export interface CacheMeta {
  lastUpdated: string;
  totalCached: number;
  size: number;
  version: string;
}

class ProductCacheService {
  private getCacheKey(productId: string): string {
    return `${CACHE_PREFIX}${productId}`;
  }

  /**
   * LOAD CACHE META
   * Untuk hydration manager - load metadata cache
   */
  async loadCacheMeta(): Promise<CacheMeta | null> {
    try {
      console.log('💾 Loading cache metadata...');
      
      const cacheMeta = await AsyncStorage.getItem(CACHE_META_KEY);
      
      if (cacheMeta) {
        const parsedData: CacheMeta = JSON.parse(cacheMeta);
        console.log('✅ Cache metadata loaded:', {
          totalCached: parsedData.totalCached,
          lastUpdated: parsedData.lastUpdated
        });
        return parsedData;
      }
      
      console.log('ℹ️ No cache metadata found');
      return null;
    } catch (error) {
      console.error('❌ Failed to load cache metadata:', error);
      throw new Error('CACHE_META_LOAD_FAILED');
    }
  }

  /**
   * SAVE CACHE META
   * Simpan metadata cache
   */
  async saveCacheMeta(cacheMeta: CacheMeta): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_META_KEY, JSON.stringify(cacheMeta));
      console.log('💾 Cache metadata saved');
    } catch (error) {
      console.error('❌ Failed to save cache metadata:', error);
      throw error;
    }
  }

  /**
   * UPDATE CACHE META
   * Update metadata berdasarkan current cache state
   */
  async updateCacheMeta(): Promise<CacheMeta> {
    try {
      const cacheInfo = await this.getCacheInfo();
      const newMeta: CacheMeta = {
        lastUpdated: new Date().toISOString(),
        totalCached: cacheInfo.total,
        size: cacheInfo.total * 1024, // Estimasi kasar
        version: '1.0'
      };

      await this.saveCacheMeta(newMeta);
      return newMeta;
    } catch (error) {
      console.error('❌ Failed to update cache metadata:', error);
      throw error;
    }
  }

  /**
   * GET PRODUCT CACHE
   * Return cached data jika masih valid, null jika expired/tidak ada
   */
  async getProductCache<T>(productId: string): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(productId);
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (!cachedData) {
        console.log(`📦 No cache found for product: ${productId}`);
        return null;
      }

      const parsedCache: CacheData<T> = JSON.parse(cachedData);
      const now = Date.now();

      // Cek TTL expiration
      if (now > parsedCache.ttl_product) {
        console.log(`⏰ Cache expired for product: ${productId}`);
        await this.clearProductCache(productId); // Auto-clean expired cache
        return null;
      }

      console.log(`✅ Using cached data for product: ${productId}`);
      return parsedCache.value;

    } catch (error) {
      console.error(`❌ Error reading cache for product ${productId}:`, error);
      return null; // Graceful degradation: return null on error
    }
  }

  /**
   * SET PRODUCT CACHE
   * Simpan data + TTL timestamp, update metadata
   */
  async setProductCache<T>(productId: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(productId);
      const cacheData: CacheData<T> = {
        value: data,
        ttl_product: Date.now() + ttl // Current time + TTL
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Cache saved for product: ${productId}, expires in ${ttl / 1000}s`);

      // Update metadata setelah save cache
      await this.updateCacheMeta();

    } catch (error) {
      console.error(`❌ Error saving cache for product ${productId}:`, error);
      // Tidak throw error, biar app tidak crash
    }
  }

  /**
   * CLEAR PRODUCT CACHE
   * Hapus cache untuk product tertentu, update metadata
   */
  async clearProductCache(productId: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(productId);
      await AsyncStorage.removeItem(cacheKey);
      console.log(`🧹 Cache cleared for product: ${productId}`);

      // Update metadata setelah clear cache
      await this.updateCacheMeta();

    } catch (error) {
      console.error(`❌ Error clearing cache for product ${productId}:`, error);
    }
  }

  /**
   * CLEAR ALL PRODUCT CACHES
   * Untuk debugging atau storage cleanup
   */
  async clearAllProductCaches(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productCacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      if (productCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(productCacheKeys);
        console.log(`🧹 Cleared ${productCacheKeys.length} product caches`);
        
        // Clear metadata juga
        await AsyncStorage.removeItem(CACHE_META_KEY);
      }
    } catch (error) {
      console.error('❌ Error clearing all product caches:', error);
    }
  }

  /**
   * GET CACHE INFO
   * Untuk debugging dan monitoring
   */
  async getCacheInfo(): Promise<{ total: number; expired: number; valid: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productCacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      let expiredCount = 0;
      let validCount = 0;
      const now = Date.now();

      // Check each cache for expiration
      for (const key of productCacheKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const parsedCache: CacheData<any> = JSON.parse(cachedData);
          if (now > parsedCache.ttl_product) {
            expiredCount++;
          } else {
            validCount++;
          }
        }
      }

      return {
        total: productCacheKeys.length,
        expired: expiredCount,
        valid: validCount
      };
    } catch (error) {
      console.error('❌ Error getting cache info:', error);
      return { total: 0, expired: 0, valid: 0 };
    }
  }

  /**
   * CLEAN EXPIRED CACHES
   * Bersihkan cache yang sudah expired
   */
  async cleanExpiredCaches(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productCacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      let cleanedCount = 0;
      const now = Date.now();

      for (const key of productCacheKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const parsedCache: CacheData<any> = JSON.parse(cachedData);
          if (now > parsedCache.ttl_product) {
            await AsyncStorage.removeItem(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired caches`);
        await this.updateCacheMeta();
      }

      return cleanedCount;
    } catch (error) {
      console.error('❌ Error cleaning expired caches:', error);
      return 0;
    }
  }

  /**
   * INITIALIZE CACHE SYSTEM
   * Untuk hydration - initialize cache system
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing product cache system...');
      
      // Clean expired caches on startup
      const cleanedCount = await this.cleanExpiredCaches();
      
      // Load or create cache metadata
      let cacheMeta = await this.loadCacheMeta();
      if (!cacheMeta) {
        cacheMeta = await this.updateCacheMeta();
      }

      console.log('✅ Product cache system initialized:', {
        cleanedExpired: cleanedCount,
        totalCached: cacheMeta.totalCached
      });

    } catch (error) {
      console.error('❌ Failed to initialize cache system:', error);
      // Jangan throw, biar app tetap jalan
    }
  }
}

export const productCacheService = new ProductCacheService();