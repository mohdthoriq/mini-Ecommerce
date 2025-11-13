// Di CartContext.tsx yang lengkap
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  cartItemCount: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>; // Tambahkan ini
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { id: product.id, product, quantity }];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // ✅ Tambahkan refreshCart function di sini
  const refreshCart = async () => {
    try {
      console.log('🔄 Refreshing cart data from API...');
      // Implementasi API call untuk mendapatkan data cart terbaru
      // Contoh: 
      // const response = await cartApi.getCart();
      // setCartItems(response.data);
      
      // Untuk sekarang, kita simulasi dengan delay dan update timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Cart data refreshed');
      
      // Simulasi update data (bisa diisi dengan real API call)
      // setCartItems(updatedCartItems);
      
    } catch (error) {
      console.error('❌ Failed to refresh cart:', error);
      throw error;
    }
  };

  const value: CartContextType = {
    cartItems,
    cartItemCount,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart, // Include in context value
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};