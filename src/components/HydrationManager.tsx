import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishListContext';
import SplashScreen from './SplashScreen';
import HydrationStatus from './HydrantionStatus';

// Services
import authService from '../services/auth/authService';
import cartService from '../services/cart/cartService';
import { wishlistService } from '../services/wishlist/wishlistService';
import { productCacheService } from '../services/product/productCacheService';

// Types
interface HydrationState {
  isHydrated: boolean;
  progress: number;
  loadedServices: string[];
  failedServices: string[];
  errors: string[];
}

interface HydrationManagerProps {
  children: React.ReactNode;
}

/**
 * Component untuk handle parallel state hydration
 * Memisahkan logic hydration dari App.tsx
 */
const HydrationManager: React.FC<HydrationManagerProps> = ({ children }) => {
  const { setUser, setToken, setIsAuthenticated } = useAuth();
  const { setCartItems, refreshCart } = useCart();
 const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  
  const [hydrationState, setHydrationState] = useState<HydrationState>({
    isHydrated: false,
    progress: 0,
    loadedServices: [],
    failedServices: [],
    errors: []
  });

  // ✅ PARALLEL STATE HYDRATION
  const hydrateAppState = useCallback(async (): Promise<void> => {
    console.log('🚀 Starting app state hydration...');
    
    const totalServices = 4; // auth, cart, wishlist, cache
    let completedServices = 0;

    const updateProgress = (serviceName: string, success: boolean = true, error?: string) => {
      completedServices++;
      const progress = Math.round((completedServices / totalServices) * 100);
      
      setHydrationState(prev => ({
        ...prev,
        progress,
        loadedServices: success 
          ? [...prev.loadedServices, serviceName]
          : prev.loadedServices,
        failedServices: !success 
          ? [...prev.failedServices, serviceName]
          : prev.failedServices,
        errors: error ? [...prev.errors, error] : prev.errors
      }));

      console.log(`📦 ${serviceName}: ${success ? '✅' : '❌'} (${progress}%)`);
    };

    try {
      // ✅ PARALLEL LOADING DENGAN PROMISE.ALL
      const hydrationPromises = [
        // 1. Auth Token Hydration
        (async () => {
          try {
            const tokenData = await authService.loadToken();
            if (tokenData) {
              setToken(tokenData.token);
              setUser(tokenData.user);
              setIsAuthenticated(true);
              console.log('🔐 Auth token hydrated');
            } else {
              // Clear auth state jika tidak ada token
              setToken(null);
              setUser(null);
              setIsAuthenticated(false);
            }
            updateProgress('Authentication', true);
          } catch (error) {
            console.error('❌ Auth hydration failed:', error);
            updateProgress('Authentication', false, 'Failed to load auth token');
            // Fallback: clear auth state
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        })(),

        // 2. Cart Data Hydration - MENGGUNAKAN CART CONTEXT YANG SUDAH ADA
        (async () => {
          try {
            // Gunakan refreshCart dari context yang sudah ada
            await refreshCart();
            console.log('🛒 Cart data hydrated using context');
            updateProgress('Cart', true);
          } catch (error) {
            console.error('❌ Cart hydration failed:', error);
            updateProgress('Cart', false, 'Failed to load cart data');
            // Fallback: empty cart sudah dihandle oleh context
          }
        })(),

        // 3. Wishlist Data Hydration
        (async () => {
          try {
            const wishlistData = await wishlistService.loadWishlist();
            if (wishlistData && Array.isArray(wishlistData.items)) {
              setWishlistItems(wishlistData.items);
              console.log('❤️ Wishlist data hydrated:', wishlistData.items.length, 'items');
            } else {
              // Fallback: empty wishlist
              setWishlistItems([]);
            }
            updateProgress('Wishlist', true);
          } catch (error) {
            console.error('❌ Wishlist hydration failed:', error);
            updateProgress('Wishlist', false, 'Failed to load wishlist data');
            // Fallback: empty wishlist
            setWishlistItems([]);
          }
        })(),

        // 4. Cache Metadata Hydration
        (async () => {
          try {
            const cacheMeta = await productCacheService.loadCacheMeta();
            console.log('💾 Cache metadata hydrated:', cacheMeta);
            updateProgress('Cache', true);
          } catch (error) {
            console.error('❌ Cache hydration failed:', error);
            updateProgress('Cache', false, 'Failed to load cache metadata');
            // Fallback: cache akan rebuild otomatis
          }
        })()
      ];

      // ✅ TUNGGU SEMUA PROMISE SELESAI
      await Promise.allSettled(hydrationPromises);

      // ✅ TUNGGU SEBENTAR UNTUK SMOOTH TRANSITION
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🎉 App state hydration completed!');
      setHydrationState(prev => ({
        ...prev,
        isHydrated: true,
        progress: 100
      }));

    } catch (error) {
      console.error('💥 Critical hydration error:', error);
      // Even if critical error, still proceed to app
      setHydrationState(prev => ({
        ...prev,
        isHydrated: true,
        errors: [...prev.errors, 'Critical hydration error']
      }));
    }
  }, [setUser, setToken, setIsAuthenticated, setCartItems, setWishlistItems, refreshCart]);

  // ✅ START HYDRATION ON MOUNT
  useEffect(() => {
    hydrateAppState();
  }, [hydrateAppState]);

  // ✅ TAMPILKAN SPLASH SCREEN SELAMA HYDRATION
  if (!hydrationState.isHydrated) {
    return (
      <>
        <SplashScreen 
          progress={hydrationState.progress}
          loadedServices={hydrationState.loadedServices}
          failedServices={hydrationState.failedServices}
        />
        <HydrationStatus hydrationState={hydrationState} />
      </>
    );
  }

  // ✅ RENDER MAIN APP SETELAH HYDRATION SELESAI
  return (
    <>
      {children}
      {/* Show hydration errors if any */}
      {hydrationState.errors.length > 0 && (
        <HydrationStatus hydrationState={hydrationState} />
      )}
    </>
  );
};

export default HydrationManager;