import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * WISHLIST SERVICE
 * Handle wishlist persistence dengan AsyncStorage
 * MultiSet/MultiGet untuk atomic operations
 */

const STORAGE_KEYS = {
  WISHLIST_ITEMS: 'wishlistItems',
  WISHLIST_META: 'wishlistMeta',
} as const;

export interface WishlistMeta {
  count: number;
  updatedAt: string; // ISO string
}

export interface WishlistState {
  items: string[]; // Array of product IDs
  meta: WishlistMeta;
}

class WishlistService {
  /**
   * LOAD WISHLIST DARI ASYNCSTORAGE
   * MultiGet untuk load items & meta sekaligus
   */
  async loadWishlist(): Promise<WishlistState> {
    try {
      const results = await AsyncStorage.multiGet([
        STORAGE_KEYS.WISHLIST_ITEMS,
        STORAGE_KEYS.WISHLIST_META,
      ]);

      // Convert results to object
      const storageData = results.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string | null>);

      // Parse wishlist items
      let items: string[] = [];
      if (storageData[STORAGE_KEYS.WISHLIST_ITEMS]) {
        try {
          items = JSON.parse(storageData[STORAGE_KEYS.WISHLIST_ITEMS]!);
          // Validate items array
          if (!Array.isArray(items)) {
            console.warn('⚠️ Invalid wishlist items format, resetting...');
            items = [];
          }
        } catch (error) {
          console.error('❌ Error parsing wishlist items:', error);
          items = [];
        }
      }

      // Parse wishlist meta
      let meta: WishlistMeta = {
        count: 0,
        updatedAt: new Date().toISOString(),
      };
      
      if (storageData[STORAGE_KEYS.WISHLIST_META]) {
        try {
          const parsedMeta = JSON.parse(storageData[STORAGE_KEYS.WISHLIST_META]!);
          // Validate meta structure
          if (parsedMeta && typeof parsedMeta.count === 'number') {
            meta = {
              count: parsedMeta.count,
              updatedAt: parsedMeta.updatedAt || new Date().toISOString(),
            };
          }
        } catch (error) {
          console.error('❌ Error parsing wishlist meta:', error);
          // Keep default meta
        }
      }

      // Ensure count matches actual items
      meta.count = items.length;

      console.log('✅ Wishlist loaded:', { items: items.length, meta });
      return { items, meta };

    } catch (error) {
      console.error('❌ WishlistService loadWishlist error:', error);
      // Return empty state sebagai fallback
      return {
        items: [],
        meta: { count: 0, updatedAt: new Date().toISOString() }
      };
    }
  }

  /**
   * TOGGLE ITEM DI WISHLIST
   * Add jika belum ada, remove jika sudah ada
   */
  async toggleItem(productId: string): Promise<WishlistState> {
    try {
      // Load current state dulu
      const currentState = await this.loadWishlist();
      let newItems: string[];

      // Toggle logic
      if (currentState.items.includes(productId)) {
        // Remove item
        newItems = currentState.items.filter(id => id !== productId);
        console.log('🗑️ Removed from wishlist:', productId);
      } else {
        // Add item
        newItems = [...currentState.items, productId];
        console.log('❤️ Added to wishlist:', productId);
      }

      // Update meta
      const newMeta: WishlistMeta = {
        count: newItems.length,
        updatedAt: new Date().toISOString(),
      };

      // Save ke AsyncStorage dengan MultiSet
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.WISHLIST_ITEMS, JSON.stringify(newItems)],
        [STORAGE_KEYS.WISHLIST_META, JSON.stringify(newMeta)],
      ]);

      console.log('💾 Wishlist saved:', { 
        items: newItems.length, 
        count: newMeta.count 
      });

      return {
        items: newItems,
        meta: newMeta,
      };

    } catch (error) {
      console.error('❌ WishlistService toggleItem error:', error);
      throw new Error('Failed to update wishlist');
    }
  }

  /**
   * CHECK APAKAH ITEM ADA DI WISHLIST
   */
  async isItemInWishlist(productId: string): Promise<boolean> {
    try {
      const { items } = await this.loadWishlist();
      return items.includes(productId);
    } catch (error) {
      console.error('❌ WishlistService isItemInWishlist error:', error);
      return false;
    }
  }

  /**
   * CLEAR ALL WISHLIST DATA
   * Untuk debugging atau reset
   */
  async clearWishlist(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.WISHLIST_ITEMS,
        STORAGE_KEYS.WISHLIST_META,
      ]);
      console.log('🧹 Wishlist cleared');
    } catch (error) {
      console.error('❌ WishlistService clearWishlist error:', error);
      throw new Error('Failed to clear wishlist');
    }
  }

  /**
   * GET WISHLIST STATS
   * Untuk display count di UI
   */
  async getWishlistStats(): Promise<{ count: number; lastUpdated: string }> {
    try {
      const { meta } = await this.loadWishlist();
      return {
        count: meta.count,
        lastUpdated: meta.updatedAt,
      };
    } catch (error) {
      console.error('❌ WishlistService getWishlistStats error:', error);
      return { count: 0, lastUpdated: new Date().toISOString() };
    }
  }
}

export const wishlistService = new WishlistService();