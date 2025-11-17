// context/CartContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem } from '../types';
import { useAuth, STORAGE_KEYS } from './AuthContext'; // ✅ Import dari AuthContext

interface CartContextType {
  cartItems: CartItem[];
  cartItemCount: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isCartLoading: boolean;
  lastCartError: string | null;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  cartItemCount: 0,
  totalPrice: 0,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
  isCartLoading: false,
  lastCartError: null,
});

// Maximum cart size to prevent storage issues
const MAX_CART_ITEMS = 100;
const MAX_STORAGE_SIZE = 2 * 1024 * 1024; // 2MB limit

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
  const { user, isAuthenticated } = useAuth(); // ✅ Dapatkan user object dan status otentikasi
  const currentUserIdRef = useRef<string | undefined>(undefined); // Track the user ID whose cart is currently loaded

  // Calculate derived values
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Helper to get user-specific storage keys
  const getUserCartStorageKey = (userId: string | undefined) => userId ? `${STORAGE_KEYS.CART_DATA}_${userId}` : STORAGE_KEYS.CART_DATA; // Fallback for guest cart
  const getUserCartBackupKey = (userId: string | undefined) => userId ? `${STORAGE_KEYS.CART_BACKUP}_${userId}` : STORAGE_KEYS.CART_BACKUP; // Fallback for guest cart

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
      const essentialCart = newCartItems.slice(0, 10); // Keep only first 10 items
      
      if (checkStorageSize(essentialCart)) {
        await AsyncStorage.setItem(getUserCartStorageKey(userId), JSON.stringify({
          items: essentialCart,
          lastUpdated: Date.now(),
          version: '1.0'
        }));
        setCartItems(essentialCart);
        setLastCartError('Storage was full. Some items were removed to free up space.');
        return;
      }

      // Strategy 2: Clear everything and save fresh
      await AsyncStorage.removeItem(getUserCartStorageKey(userId));
      await AsyncStorage.setItem(getUserCartStorageKey(userId), JSON.stringify({
        items: newCartItems,
        lastUpdated: Date.now(),
        version: '1.0'
      }));
      
      setLastCartError('Storage was cleared and cart has been reset.');
    } catch (retryError: any) {
      console.error('❌ Failed to handle quota exceeded:', retryError);
      setLastCartError('Critical storage error. Cart data may be lost.');
    }
  }, [checkStorageSize, getUserCartStorageKey, setCartItems, setLastCartError]);

  // Optimize storage by compressing data
  const handleStorageOptimization = useCallback(async (newCartItems: CartItem[], userId: string | undefined): Promise<void> => {
    try {
      console.log('🔄 Optimizing storage...');
      
      // Remove old backup data first
      await AsyncStorage.removeItem(getUserCartBackupKey(userId));
      
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
      await AsyncStorage.setItem(getUserCartStorageKey(userId), JSON.stringify({
        items: optimizedCart,
        lastUpdated: Date.now(),
        version: '1.0'
      }));

      setCartItems(optimizedCart as CartItem[]);
      setLastCartError('Cart optimized for storage limitations.');
      
    } catch (optimizeError: any) {
      console.error('❌ Storage optimization failed:', optimizeError);
      await handleQuotaExceeded(newCartItems, userId);
    }
  }, [handleQuotaExceeded, getUserCartStorageKey, getUserCartBackupKey, setCartItems, setLastCartError]);

  // Save cart with mergeItem for small updates
  const saveCartToStorage = useCallback(async (newCartItems: CartItem[], userId: string | undefined): Promise<void> => {
    try {
      const storageKey = getUserCartStorageKey(userId);
      const backupKey = getUserCartBackupKey(userId);
      
      // Check storage size
      if (!checkStorageSize(newCartItems)) {
        console.warn('🔄 Storage size approaching limit, optimizing...');
        await handleStorageOptimization(newCartItems, userId);
        return;
      }

      // Use mergeItem for efficient updates
      await AsyncStorage.mergeItem(storageKey,
        JSON.stringify({
          items: newCartItems,
          lastUpdated: Date.now(),
          version: '1.0'
        })
      );

      // Create backup only if we have important data
      if (newCartItems.length > 0) {
        await AsyncStorage.setItem(backupKey, JSON.stringify(newCartItems));
      } else {
        await AsyncStorage.removeItem(backupKey); // Remove backup if cart is empty
      }
      
      setLastCartError(null);
      console.log(`💾 Cart saved successfully for user: ${userId || 'guest'}`);
    } catch (error: any) {
      console.error(`❌ Error saving cart for user ${userId || 'guest'}:`, error);
      
      // Handle different error types
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        setLastCartError('Storage is full. Please clear some items from your cart.');
        await handleQuotaExceeded(newCartItems, userId);
      } else {
        setLastCartError('Failed to save cart changes. Please try again.');
      }
      throw error;
    }
  }, [checkStorageSize, handleQuotaExceeded, handleStorageOptimization, getUserCartStorageKey, getUserCartBackupKey, setLastCartError]);

  // Load cart from storage
  const loadCartFromStorage = useCallback(async (userId: string | undefined): Promise<CartItem[]> => {
    try {
      const storageKey = getUserCartStorageKey(userId);
      const backupKey = getUserCartBackupKey(userId);
      const cartData = await AsyncStorage.getItem(storageKey);
      
      if (!cartData) {
        // Try to load from backup
        const backupData = await AsyncStorage.getItem(backupKey);
        if (backupData) {
          console.log(`🔄 Loading cart from backup for user: ${userId || 'guest'}`);
          return JSON.parse(backupData);
        }
        return [];
      }

      const parsedData = JSON.parse(cartData);
      return parsedData.items || [];
    } catch (error) {
      console.error(`❌ Error loading cart for user ${userId || 'guest'}:`, error);
      
      // Try to load from backup
      try {
        const backupKey = getUserCartBackupKey(userId);
        const backupData = await AsyncStorage.getItem(backupKey);
        if (backupData) {
          console.log(`🔄 Loading cart from backup after error for user: ${userId || 'guest'}`);
          return JSON.parse(backupData);
        }
      } catch (backupError) {
        console.error(`❌ Backup also failed for user ${userId}:`, backupError);
      }
      
      return [];
    }
  }, [getUserCartStorageKey, getUserCartBackupKey]);

  // Handle user change and cart switching
  const handleUserChange = useCallback(async () => {
    const currentUserId = user?.id;
    
    // If user hasn't changed, do nothing
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

  // Add to cart with optimistic updates
  const addToCart = async (product: Product, quantity: number = 1): Promise<void> => {
    try {
      setIsCartLoading(true);
      setLastCartError(null);

      // Check if cart is full
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
        } else {
          // Add new item
          newItems = [...prevItems, { id: `${product.id}-${Date.now()}`, product, quantity }];
        }

        // Save to storage (fire and forget for better performance)
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

  // Update quantity with mergeItem optimization
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
        ).filter(item => item.quantity > 0); // Remove items with zero quantity

        // Use mergeItem for small updates
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

  // Remove from cart
  const removeFromCart = async (productId: string): Promise<void> => {
    try {
      setCartItems(prevItems => {
        const newItems = prevItems.filter(item => item.product.id !== productId);

        // Use mergeItem for removal
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

  // Clear entire cart
  const clearCart = async (): Promise<void> => {
    try {
      const storageKey = getUserCartStorageKey(user?.id);
      const backupKey = getUserCartBackupKey(user?.id);
      setCartItems([]);
      await AsyncStorage.multiRemove([storageKey, backupKey]);
      setLastCartError(null);
      console.log('🧹 Cart cleared');
    } catch (error: any) {
      console.error('❌ Error clearing cart:', error);
      setLastCartError(error.message || 'Failed to clear cart');
      throw error;
    }
  };

  // Refresh cart from storage
  const refreshCart = async (): Promise<void> => {
    try {
      setIsCartLoading(true);
      const savedCart = await loadCartFromStorage(user?.id);
      setCartItems(savedCart);
      setLastCartError(null);
      console.log('🔄 Cart refreshed');
    } catch (error: any) {
      console.error('❌ Error refreshing cart:', error);
      setLastCartError(error.message || 'Failed to refresh cart');
      throw error;
    } finally {
      setIsCartLoading(false);
    }
  };

  // Non-blocking auto-save dengan error suppression
  useEffect(() => {
    const autoSave = async () => {
      if (isSaving || cartItems.length === 0 || isCartLoading) {
        return;
      }

      setIsSaving(true);
      try {
        await saveCartToStorage(cartItems, user?.id);
      } catch (error) {
        // Suppress auto-save errors, hanya log saja
        console.log('🔄 Auto-save failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsSaving(false);
      }
    };

    const timeoutId = setTimeout(autoSave, 2000); // 2 second debounce
    return () => clearTimeout(timeoutId);
  }, [cartItems, isCartLoading, isSaving, saveCartToStorage, user?.id]);

  const value: CartContextType = {
    cartItems,
    cartItemCount,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    isCartLoading,
    lastCartError,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};