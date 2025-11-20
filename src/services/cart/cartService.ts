import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../../types';

interface CartData {
  items: CartItem[];
  lastUpdated: string;
  version: string;
}

class CartService {
  private readonly CART_STORAGE_KEYS = {
    CART_DATA: 'cartData',
    CART_BACKUP: 'cartBackup',
  } as const;

  // ✅ GET USER-SPECIFIC STORAGE KEY
  private getUserCartStorageKey(userId: string | undefined): string {
    return userId ? `${this.CART_STORAGE_KEYS.CART_DATA}_${userId}` : this.CART_STORAGE_KEYS.CART_DATA;
  }

  // ✅ LOAD CART DATA UNTUK HYDRATION
  async loadCart(userId?: string): Promise<CartData | null> {
    try {
      console.log('🛒 Loading cart data from storage...');
      
      const storageKey = this.getUserCartStorageKey(userId);
      const cartData = await AsyncStorage.getItem(storageKey);
      
      if (cartData) {
        const parsedData: CartData = JSON.parse(cartData);
        console.log(`✅ Cart data loaded: ${parsedData.items?.length || 0} items`);
        return parsedData;
      }
      
      console.log('ℹ️ No cart data found in storage');
      return null;
    } catch (error) {
      console.error('❌ Failed to load cart data:', error);
      
      // Try backup
      try {
        const backupKey = userId ? `${this.CART_STORAGE_KEYS.CART_BACKUP}_${userId}` : this.CART_STORAGE_KEYS.CART_BACKUP;
        const backupData = await AsyncStorage.getItem(backupKey);
        if (backupData) {
          console.log('🔄 Loading from backup cart data');
          return {
            items: JSON.parse(backupData),
            lastUpdated: new Date().toISOString(),
            version: '1.0'
          };
        }
      } catch (backupError) {
        console.error('❌ Backup also failed:', backupError);
      }
      
      throw new Error('CART_LOAD_FAILED');
    }
  }

  // ✅ SAVE CART DATA
  async saveCart(cartData: CartData, userId?: string): Promise<void> {
    try {
      const storageKey = this.getUserCartStorageKey(userId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(cartData));
      console.log('💾 Cart data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save cart data:', error);
      throw error;
    }
  }

  // ✅ CLEAR CART DATA
  async clearCart(userId?: string): Promise<void> {
    try {
      const storageKey = this.getUserCartStorageKey(userId);
      const backupKey = userId ? `${this.CART_STORAGE_KEYS.CART_BACKUP}_${userId}` : this.CART_STORAGE_KEYS.CART_BACKUP;
      
      await AsyncStorage.multiRemove([storageKey, backupKey]);
      console.log('🧹 Cart data cleared');
    } catch (error) {
      console.error('❌ Failed to clear cart data:', error);
      throw error;
    }
  }
}

export default new CartService();