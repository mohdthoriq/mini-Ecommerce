import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem } from '../types';
import { CartContextType } from '../types/cart';
import { useAuth } from './AuthContext';
import { safeStorage } from '../utils/safeStorage';

// ✅ Define storage keys locally di CartContext
const CART_STORAGE_KEYS = {
  CART_DATA: 'cartData',
  CART_BACKUP: 'cartBackup',
} as const;

// Maximum cart size to prevent storage issues
const MAX_CART_ITEMS = 100;
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB limit

// ✅ GUNAKAN TYPE YANG SUDAH DI DEFINISIKAN
const CartContext = createContext<CartContextType>({
  cartItems: [],
  cartItemCount: 0,
  totalPrice: 0,
  isCartLoading: false,
  lastCartError: null,
  setCartItems: () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [lastCartError, setLastCartError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const currentUserIdRef = useRef<string | undefined>(undefined);

  // Calculate derived values
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // ✅ FIX: Helper to get user-specific storage keys
  const getUserCartStorageKey = useCallback((userId: string | undefined) => 
    userId ? `${CART_STORAGE_KEYS.CART_DATA}_${userId}` : CART_STORAGE_KEYS.CART_DATA, []);

  const getUserCartBackupKey = useCallback((userId: string | undefined) => 
    userId ? `${CART_STORAGE_KEYS.CART_BACKUP}_${userId}` : CART_STORAGE_KEYS.CART_BACKUP, []);

  // ✅ SETTER UNTUK HYDRATION (EXPOSED)
  const handleSetCartItems = useCallback((items: CartItem[]) => {
    console.log('🛒 Setting cart items from hydration:', items.length, 'items');
    setCartItems(items);
    setIsCartLoading(false);
    setLastCartError(null);
  }, []);

  // Check storage size before saving
  const checkStorageSize = (data: any): boolean => {
    try {
      const dataSize = JSON.stringify(data).length;
      const isWithinLimit = dataSize < MAX_STORAGE_SIZE;

      if (!isWithinLimit) {
        console.warn(`📏 Storage limit exceeded: ${dataSize} bytes > ${MAX_STORAGE_SIZE} bytes`);
      }

      return isWithinLimit;
    } catch {
      return false;
    }
  };

  // Handle quota exceeded by clearing old data and retrying
  const handleQuotaExceeded = useCallback(async (newCartItems: CartItem[], userId: string | undefined): Promise<void> => {
    try {
      console.log('🔄 Handling quota exceeded...');
      
      // Strategy 1: Try to save only essential data
      const essentialCart = newCartItems.slice(0, 10);
      
      if (checkStorageSize(essentialCart)) {
        await safeStorage.safeSave(getUserCartStorageKey(userId), {
          items: essentialCart,
          lastUpdated: Date.now(),
          version: '1.0'
        });
        setCartItems(essentialCart);
        setLastCartError('Storage was full. Some items were removed to free up space.');
        return;
      }

      // Strategy 2: Clear everything and save fresh
      await safeStorage.safeRemove(getUserCartStorageKey(userId));
      await safeStorage.safeSave(getUserCartStorageKey(userId), {
        items: newCartItems,
        lastUpdated: Date.now(),
        version: '1.0'
      });
      
      setLastCartError('Storage was cleared and cart has been reset.');
    } catch (retryError: any) {
      console.error('❌ Failed to handle quota exceeded:', retryError);
      setLastCartError('Critical storage error. Cart data may be lost.');
    }
  }, [getUserCartStorageKey]);

  // Optimize storage by compressing data
  const handleStorageOptimization = useCallback(async (newCartItems: CartItem[], userId: string | undefined): Promise<void> => {
    try {
      console.log('🔄 Optimizing storage...');
      
      // Remove old backup data first
      await safeStorage.safeRemove(getUserCartBackupKey(userId));
      
      // Compress data by removing unnecessary fields
      const optimizedCart = newCartItems.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
        },
        quantity: item.quantity
      }));

      // Limit cart size if needed
      if (optimizedCart.length > 50) {
        console.warn('📦 Cart too large, keeping only recent 50 items');
        optimizedCart.splice(0, optimizedCart.length - 50);
      }

      // Try saving optimized data
      await safeStorage.safeSave(getUserCartStorageKey(userId), {
        items: optimizedCart,
        lastUpdated: Date.now(),
        version: '1.0'
      });

      setCartItems(optimizedCart as CartItem[]);
      setLastCartError('Cart optimized for storage limitations.');
      
    } catch (optimizeError: any) {
      console.error('❌ Storage optimization failed:', optimizeError);
      await handleQuotaExceeded(newCartItems, userId);
    }
  }, [getUserCartBackupKey, getUserCartStorageKey, handleQuotaExceeded]);

  // Save cart to storage dengan safeStorage
  const saveCartToStorage = useCallback(async (newCartItems: CartItem[], userId: string | undefined): Promise<void> => {
    try {
      const storageKey = getUserCartStorageKey(userId);
      
      // Check storage size
      if (!checkStorageSize(newCartItems)) {
        console.warn('🔄 Storage size approaching limit, optimizing...');
        await handleStorageOptimization(newCartItems, userId);
        return;
      }

      // Save main cart data dengan safeStorage
      const saveResult = await safeStorage.safeSave(storageKey, {
        items: newCartItems,
        lastUpdated: Date.now(),
        version: '1.0'
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save cart');
      }
      
      setLastCartError(null);
      console.log(`💾 Cart saved successfully for user: ${userId || 'guest'}`);
    } catch (error: any) {
      console.error(`❌ Error saving cart for user ${userId || 'guest'}:`, error);
      
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        setLastCartError('Storage is full. Please clear some items from your cart.');
        await handleQuotaExceeded(newCartItems, userId);
      } else {
        setLastCartError('Failed to save cart changes. Please try again.');
      }
      throw error;
    }
  }, [getUserCartStorageKey, handleQuotaExceeded, handleStorageOptimization]);

  // Load cart from storage dengan safeStorage
  const loadCartFromStorage = useCallback(async (userId: string | undefined): Promise<CartItem[]> => {
    try {
      const storageKey = getUserCartStorageKey(userId);
      
      const result = await safeStorage.safeLoad<CartItem[]>(
        storageKey,
        [], // fallback empty array
        { maxRetries: 3, repairAttempts: 2 }
      );
      
      if (result.success && result.data) {
        if (result.wasRepaired) {
          console.log('🔧 Cart data was repaired during load');
        }
        return result.data;
      } else {
        console.warn('⚠️ Using fallback cart data due to storage issues');
        return [];
      }
    } catch (error) {
      console.error(`❌ Error loading cart for user ${userId || 'guest'}:`, error);
      return [];
    }
  }, [getUserCartStorageKey]);

  // Handle user change and cart switching
  const handleUserChange = useCallback(async () => {
    const currentUserId = user?.id;
    
    if (currentUserIdRef.current === currentUserId) {
      return;
    }

    setIsCartLoading(true);
    try {
      // Save current user's cart before switching
      if (currentUserIdRef.current !== undefined && cartItems.length > 0) {
        await saveCartToStorage(cartItems, currentUserIdRef.current);
      }

      // Load new user's cart
      const newUserCart = await loadCartFromStorage(currentUserId);
      setCartItems(newUserCart);
      currentUserIdRef.current = currentUserId;
      
      console.log(`🔄 Switched cart for user: ${currentUserId || 'guest'}`);
    } catch (error) {
      console.error('❌ Failed to switch user cart:', error);
      setLastCartError('Failed to load cart data');
    } finally {
      setIsCartLoading(false);
    }
  }, [user, cartItems, saveCartToStorage, loadCartFromStorage]);

  // Initialize cart on app start and user change
  useEffect(() => {
    handleUserChange();
  }, [handleUserChange]);

  // ✅ IMPLEMENTASI FUNGSI ADD TO CART
  const addToCart = async (product: Product, quantity: number = 1): Promise<void> => {
    try {
      setIsCartLoading(true);
      setLastCartError(null);

      if (cartItemCount + quantity > MAX_CART_ITEMS) {
        throw new Error(`Cart cannot exceed ${MAX_CART_ITEMS} items`);
      }

      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.product.id === product.id);
        let newItems: CartItem[];

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          newItems = prevItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          console.log(`🔄 Updated quantity for "${product.name}" to ${newItems[existingItemIndex].quantity}`);
        } else {
          // Add new item
          const newCartItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product: product,
            quantity: quantity,
          };
          newItems = [...prevItems, newCartItem];
          console.log(`✨ Added "${product.name}" to cart`);
        }

        // Auto-save to storage
        saveCartToStorage(newItems, user?.id).catch(error => {
          console.error('Background save failed:', error);
        });

        return newItems;
      });

    } catch (error: any) {
      console.error('❌ Error adding to cart:', error);
      setLastCartError(error.message || 'Failed to add item to cart');
      throw error;
    } finally {
      setIsCartLoading(false);
    }
  };

  // ✅ IMPLEMENTASI FUNGSI UPDATE QUANTITY
  const updateQuantity = async (productId: string, quantity: number): Promise<void> => {
    try {
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      if (quantity === 0) {
        await removeFromCart(productId);
        return;
      }

      setCartItems(prevItems => {
        const newItems = prevItems.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        ).filter(item => item.quantity > 0);

        console.log(`📊 Updated quantity for product ${productId} to ${quantity}`);

        saveCartToStorage(newItems, user?.id).catch(error => {
          console.error('Background save failed:', error);
        });

        return newItems;
      });

    } catch (error: any) {
      console.error('❌ Error updating quantity:', error);
      setLastCartError(error.message || 'Failed to update quantity');
      throw error;
    }
  };

  // ✅ IMPLEMENTASI FUNGSI REMOVE FROM CART
  const removeFromCart = async (productId: string): Promise<void> => {
    try {
      setCartItems(prevItems => {
        const newItems = prevItems.filter(item => item.product.id !== productId);
        
        console.log(`🗑️ Removed product ${productId} from cart`);

        saveCartToStorage(newItems, user?.id).catch(error => {
          console.error('Background save failed:', error);
        });

        return newItems;
      });
    } catch (error: any) {
      console.error('❌ Error removing from cart:', error);
      setLastCartError(error.message || 'Failed to remove item from cart');
      throw error;
    }
  };

  // ✅ IMPLEMENTASI FUNGSI CLEAR CART
  const clearCart = async (): Promise<void> => {
    try {
      const storageKey = getUserCartStorageKey(user?.id);
      const backupKey = getUserCartBackupKey(user?.id);
      
      setCartItems([]);
      
      // Clear storage dengan safeRemove
      await Promise.all([
        safeStorage.safeRemove(storageKey),
        safeStorage.safeRemove(backupKey)
      ]);
      
      setLastCartError(null);
      console.log('🧹 Cart cleared');
    } catch (error: any) {
      console.error('❌ Error clearing cart:', error);
      setLastCartError(error.message || 'Failed to clear cart');
      throw error;
    }
  };

  // ✅ IMPLEMENTASI FUNGSI REFRESH CART
  const refreshCart = async (): Promise<void> => {
    try {
      setIsCartLoading(true);
      const savedCart = await loadCartFromStorage(user?.id);
      setCartItems(savedCart);
      setLastCartError(null);
      console.log('🔄 Cart refreshed from storage');
    } catch (error: any) {
      console.error('❌ Error refreshing cart:', error);
      setLastCartError(error.message || 'Failed to refresh cart');
      throw error;
    } finally {
      setIsCartLoading(false);
    }
  };

  // Auto-save dengan safeStorage
  useEffect(() => {
    const autoSave = async () => {
      if (isSaving || cartItems.length === 0 || isCartLoading) {
        return;
      }

      setIsSaving(true);
      try {
        await saveCartToStorage(cartItems, user?.id);
      } catch (error) {
        console.log('🔄 Auto-save failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [cartItems, isCartLoading, isSaving, saveCartToStorage, user?.id]);

  const value: CartContextType = {
    // State
    cartItems,
    cartItemCount,
    totalPrice,
    isCartLoading,
    lastCartError,
    
    // Setters untuk hydration
    setCartItems: handleSetCartItems,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};