import React, { createContext, useState, useContext, useCallback } from 'react';
import { Product } from '../types';

interface WishlistContextType {
  // State
  wishlistItems: Product[];
  
  // Setters untuk hydration
  setWishlistItems: (items: Product[]) => void;
  
  // Actions
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: React.ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);

  // ✅ SETTER UNTUK HYDRATION (EXPOSED)
  const handleSetWishlistItems = useCallback((items: Product[]) => {
    console.log('❤️ Setting wishlist items from hydration:', items.length, 'items');
    setWishlistItems(items);
  }, []);

  const addToWishlist = useCallback((product: Product) => {
    setWishlistItems(prev => {
      if (prev.find(item => item.id === product.id)) {
        return prev; // Already in wishlist
      }
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
  }, []);

  const value: WishlistContextType = {
    // State
    wishlistItems,
    
    // Setters untuk hydration
    setWishlistItems: handleSetWishlistItems,
    
    // Actions
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};