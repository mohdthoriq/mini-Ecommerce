import { useState, useEffect, useCallback } from 'react';
import { wishlistService, WishlistState } from './wishlistService';
import { safeStorage } from '../../utils/safeStorage';

/**
 * USE WISHLIST HOOK
 * State management untuk wishlist di UI components
 * Now with safe storage handling and auto-recovery
 */

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<WishlistState>({
    items: [],
    meta: { count: 0, updatedAt: new Date().toISOString() }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageHealth, setStorageHealth] = useState<'healthy' | 'repaired' | 'replaced'>('healthy');

  /**
   * LOAD WISHLIST PADA APP STARTUP DENGAN SAFE STORAGE
   */
  const loadWishlist = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Use safeLoad instead of direct service call
      const fallbackWishlist: WishlistState = {
        items: [],
        meta: { count: 0, updatedAt: new Date().toISOString() }
      };
      
      const result = await safeStorage.safeLoad<WishlistState>(
        'wishlist_data',
        fallbackWishlist,
        { maxRetries: 3, repairAttempts: 2 }
      );
      
      if (result.success && result.data) {
        setWishlist(result.data);
        
        // Track storage health for debugging
        if (result.wasRepaired) {
          setStorageHealth('repaired');
          console.log('🔧 Wishlist data was repaired during load');
        } else {
          setStorageHealth('healthy');
        }
      } else {
        setWishlist(fallbackWishlist);
        setStorageHealth('replaced');
        console.warn('⚠️ Using fallback wishlist data due to storage issues');
      }
      
    } catch (err) {
      console.error('❌ useWishlist load error:', err);
      setError('Failed to load wishlist');
      
      // Fallback to empty state
      setWishlist({
        items: [],
        meta: { count: 0, updatedAt: new Date().toISOString() }
      });
      setStorageHealth('replaced');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * TOGGLE ITEM - UPDATE STATE & STORAGE DENGAN SAFE SAVE
   */
  const toggleItem = useCallback(async (productId: string): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update
      const currentItems = [...wishlist.items];
      const itemIndex = currentItems.indexOf(productId);
      let newItems: string[];
      
      if (itemIndex > -1) {
        // Remove item
        newItems = currentItems.filter(id => id !== productId);
      } else {
        // Add item
        newItems = [...currentItems, productId];
      }
      
      const updatedWishlist: WishlistState = {
        items: newItems,
        meta: {
          count: newItems.length,
          updatedAt: new Date().toISOString()
        }
      };
      
      // Update UI immediately
      setWishlist(updatedWishlist);
      
      // Save to storage safely
      const saveResult = await safeStorage.safeSave('wishlist_data', updatedWishlist);
      
      if (!saveResult.success) {
        console.error('❌ Failed to save wishlist:', saveResult.error);
        // Revert optimistic update
        await loadWishlist();
      }
      
    } catch (err) {
      console.error('❌ useWishlist toggle error:', err);
      setError('Failed to update wishlist');
      // Revert optimistic update dengan reload
      await loadWishlist();
    }
  }, [wishlist.items, loadWishlist]);

  /**
   * CHECK IF ITEM IN WISHLIST
   */
  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlist.items.includes(productId);
  }, [wishlist.items]);

  /**
   * CLEAR WISHLIST DENGAN SAFE REMOVE
   */
  const clearWishlist = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Optimistic update
      setWishlist({
        items: [],
        meta: { count: 0, updatedAt: new Date().toISOString() }
      });
      
      // Remove from storage safely
      const removeResult = await safeStorage.safeRemove('wishlist_data');
      
      if (!removeResult.success) {
        console.error('❌ Failed to clear wishlist storage:', removeResult.error);
        // Still consider it successful since UI is updated
      }
      
    } catch (err) {
      console.error('❌ useWishlist clear error:', err);
      setError('Failed to clear wishlist');
      // Reload to ensure consistency
      await loadWishlist();
    }
  }, [loadWishlist]);

  /**
   * CHECK STORAGE HEALTH
   */
  const checkStorageHealth = useCallback(async (): Promise<void> => {
    try {
      const fallbackWishlist: WishlistState = {
        items: [],
        meta: { count: 0, updatedAt: new Date().toISOString() }
      };
      
      const health = await safeStorage.checkStorageHealth('wishlist_data', fallbackWishlist);
      console.log('🩺 Wishlist storage health:', health);
      
    } catch (err) {
      console.error('❌ Storage health check failed:', err);
    }
  }, []);

  // Load wishlist on mount
  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  return {
    // State
    wishlist,
    loading,
    error,
    storageHealth,
    
    // Actions
    toggleItem,
    isInWishlist,
    clearWishlist,
    refreshWishlist: loadWishlist,
    checkStorageHealth,
    
    // Convenience properties
    wishlistCount: wishlist.meta.count,
    wishlistItems: wishlist.items,
  };
};