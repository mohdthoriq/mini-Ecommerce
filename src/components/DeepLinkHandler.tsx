import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useCart } from '../context/CartContext';
import { productApi } from '../services/api/productApi';
import deepLinkingHandler from '../utils/deepLinkingHandler';
import ProcessingOverlay from './ProcessingOverlay';

interface DeepLinkHandlerProps {
  children: React.ReactNode;
}

/**
 * Component untuk handle deep links dengan add-to-cart functionality
 * Memisahkan logic deep link dari main App component
 */
const DeepLinkHandler: React.FC<DeepLinkHandlerProps> = ({ children }) => {
  const { addToCart } = useCart();
  const appState = useRef(AppState.currentState);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Setup deep link callbacks untuk add-to-cart
  const setupDeepLinkCallbacks = useCallback(() => {
    const callbacks = {
      onAddToCart: async (productId: string) => {
        if (isProcessing) {
          console.log('⏳ Skip add-to-cart, already processing...');
          return;
        }

        setIsProcessing(true);
        console.log(`🛒 Deep link add-to-cart for product: ${productId}`);

        try {
          // Fetch product details dengan error handling
          const product = await productApi.getProductById(productId);
          
          // Add to cart
          addToCart(product);
          
          // Show success feedback
          Alert.alert(
            'Added to Cart 🛒', 
            `${product.name} has been added to your cart!`,
            [
              { 
                text: 'View Cart', 
                onPress: () => {
                  console.log('Navigating to cart...');
                }
              },
              { 
                text: 'Continue Shopping', 
                style: 'cancel' 
              }
            ]
          );
          
          console.log('✅ Product added to cart via deep link');
          
        } catch (error: any) {
          console.error('❌ Failed to add product via deep link:', error);
          
          // Error handling dengan berbagai scenario
          if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
            Alert.alert(
              'Network Error',
              'Please check your internet connection and try again.'
            );
          } else if (error.response?.status === 404) {
            Alert.alert(
              'Product Not Found',
              'The requested product could not be found.'
            );
          } else if (error.message?.includes('AbortError')) {
            console.log('Request was aborted');
          } else {
            Alert.alert(
              'Error',
              'Failed to add product to cart. Please try again.'
            );
          }
        } finally {
          setIsProcessing(false);
        }
      },
      
      onViewProduct: (productId: string) => {
        console.log(`🔍 Deep link view-product for product: ${productId}`);
        // Navigation akan dihandle oleh deepLinkingHandler
      },
      
      onOpenCart: () => {
        console.log('🛒 Deep link open-cart');
        // Navigation akan dihandle oleh deepLinkingHandler
      }
    };

    deepLinkingHandler.setCallbacks(callbacks);
    console.log('✅ Deep link callbacks setup completed');
  }, [addToCart, isProcessing]);

  // ✅ Setup app state monitoring untuk handle background/foreground transitions
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`🔄 App state changed: ${appState.current} → ${nextAppState}`);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App kembali ke foreground, process pending deep links
        console.log('📱 App came to foreground, checking for pending deep links...');
        setTimeout(() => {
          deepLinkingHandler.processPendingUrl();
        }, 500);
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // ✅ Setup deep link callbacks ketika component mount
  useEffect(() => {
    setupDeepLinkCallbacks();
  }, [setupDeepLinkCallbacks]);

  return (
    <>
      {children}
      <ProcessingOverlay visible={isProcessing} message="Adding to cart..." />
    </>
  );
};

export default DeepLinkHandler;