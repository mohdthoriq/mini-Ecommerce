import { Product, CartItem } from './index';

export interface CartContextType {
  // State
  cartItems: CartItem[];
  cartItemCount: number;
  totalPrice: number;
  isCartLoading: boolean;
  lastCartError: string | null;
  
  // Setters untuk hydration
  setCartItems: (items: CartItem[]) => void;
  
  // Actions
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCartAfterCheckout: () => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}