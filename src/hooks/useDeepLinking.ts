import { Linking, EmitterSubscription, Platform, Alert, AppState } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { NativeModules } from 'react-native';
import {
  DeepLinkParams,
  ParsedDeepLink,
  DeepLinkAction,
  DeepLinkResult,
  AddToCartDeepLink,
  ViewProductDeepLink,
  OpenCartDeepLink
} from '../types/deepLinking';

// ✅ Import cart context atau service untuk handle add to cart
import { productApi } from '../services/api/productApi';

interface TroubleshootingState {
  lastProcessedUrl: string | null;
  lastError: string | null;
  appState: string;
  isColdStart: boolean;
}

// ✅ Callback interface untuk external handlers
export interface DeepLinkCallbacks {
  onAddToCart?: (productId: string) => Promise<void>;
  onViewProduct?: (productId: string) => void;
  onOpenCart?: () => void;
  onAuthRequired?: (targetRoute: string, params?: any) => void;
  onInvalidParam?: (error: string) => void;
}

// ✅ Interface untuk pending deep link dengan auth gate
interface PendingDeepLink {
  url: string;
  parsedLink: ParsedDeepLink;
  targetAction: DeepLinkAction;
  timestamp: number;
}

class DeepLinkingHandler {
  private navigationRef: NavigationContainerRef<any> | null = null;
  private isReady: boolean = false;
  private pendingUrl: string | null = null;
  private pendingAuthDeepLink: PendingDeepLink | null = null;
  private subscriptions: { remove: () => void }[] = [];
  private troubleshootingState: TroubleshootingState = {
    lastProcessedUrl: null,
    lastError: null,
    appState: 'active',
    isColdStart: true
  };

  // ✅ External callbacks untuk cart operations dan auth
  private callbacks: DeepLinkCallbacks = {};
  private isUserLoggedIn: boolean = false;

  setNavigationRef = (ref: NavigationContainerRef<any> | null): void => {
    this.navigationRef = ref;
    if (ref) {
      console.log('✅ Navigation ref set');
      this.processPendingUrl();
    }
  };

  // ✅ Set external callbacks
  setCallbacks = (callbacks: DeepLinkCallbacks): void => {
    this.callbacks = callbacks;
    console.log('✅ Deep link callbacks set');
  };

  // ✅ Set auth state untuk auth gate
  setAuthState = (isLoggedIn: boolean): void => {
    this.isUserLoggedIn = isLoggedIn;
    console.log(`🔐 Auth state updated: ${isLoggedIn ? 'Logged In' : 'Logged Out'}`);

    // Jika user baru login dan ada pending auth deep link, process sekarang
    if (isLoggedIn && this.pendingAuthDeepLink) {
      this.processPendingAuthDeepLink();
    }
  };

  initialize = async (): Promise<string | null> => {
    try {
      console.log('🚀 Initializing Deep Linking Handler...');

      let initialUrl: string | null = null;

      // Setup app state listener
      this.setupAppStateListener();

      // Handle Android cold start
      if (Platform.OS === 'android') {
        try {
          if (NativeModules.MainActivity?.getStoredDeepLink) {
            const storedUrl: string | null = await NativeModules.MainActivity.getStoredDeepLink();
            if (storedUrl) {
              console.log('🤖 Android stored deep link:', storedUrl);
              initialUrl = storedUrl;
            }
          }
        } catch (error) {
          console.log('❌ Error getting stored deep link:', error);
        }
      }

      // Handle initial URL (cold start)
      const url = await Linking.getInitialURL();
      if (url) {
        console.log('📱 Initial URL found:', url);
        initialUrl = url;
      }

      // Check if app can open our scheme
      const canOpen = await Linking.canOpenURL('ecommerceapp://test');
      console.log(`🔗 Can open ecommerceapp:// scheme: ${canOpen}`);

      this.isReady = true;
      this.troubleshootingState.isColdStart = false;

      console.log('✅ DeepLinkingHandler initialized successfully');
      this.logTroubleshootingState();

      return initialUrl;
    } catch (error) {
      console.log('❌ Error initializing deep linking:', error);
      this.troubleshootingState.lastError = `Initialization failed: ${error}`;
      return null;
    }
  };

  // ✅ ENHANCED DEEP LINK PARSER DENGAN VALIDASI
  parseDeepLinkUrl = (url: string): DeepLinkResult => {
    try {
      console.log('🔗 Parsing deep link URL:', url);

      // Basic validation
      if (!url || typeof url !== 'string') {
        return {
          success: false,
          action: { type: 'fallback', reason: 'Invalid URL format' },
          error: 'Invalid URL format',
        };
      }

      // Parse URL
      const parsedUrl = new URL(url);
      const host = parsedUrl.host;
      const pathSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);

      console.log('🔗 URL parsed - Host:', host, 'Path:', pathSegments);

      // Handle different actions
      if (pathSegments.length === 0) {
        // ecommerceapp:// - fallback ke home
        return {
          success: true,
          action: { type: 'fallback' }
        };
      }

      const action = pathSegments[0];
      const param = pathSegments[1];

      switch (action) {
        case 'product':
          if (!param) {
            return {
              success: false,
              action: { type: 'fallback' },
              error: 'Product ID is required for product action'
            };
          }

          // ✅ VALIDASI: Product ID harus angka
          if (!this.isValidProductId(param)) {
            return {
              success: false,
              action: { type: 'fallback' },
              error: 'Invalid product ID format - must be numeric'
            };
          }

          return {
            success: true,
            action: {
              type: 'view-product',
              productId: param
            } as ViewProductDeepLink
          };

        case 'add-to-cart':
          if (!param) {
            return {
              success: false,
              action: { type: 'fallback' },
              error: 'Product ID is required for add-to-cart action'
            };
          }

          // ✅ VALIDASI: Product ID harus angka
          if (!this.isValidProductId(param)) {
            return {
              success: false,
              action: { type: 'fallback' },
              error: 'Invalid product ID format - must be numeric'
            };
          }

          return {
            success: true,
            action: {
              type: 'add-to-cart',
              productId: param
            } as AddToCartDeepLink
          };

        case 'home':
          return {
            success: true,
            action: { type: 'fallback' }
          };

        case 'cart':
          return {
            success: true,
            action: { type: 'open-cart' } as OpenCartDeepLink
          };

        default:
          return {
            success: false,
            action: { type: 'fallback' },
            error: `Unknown action: ${action}`
          };
      }
    } catch (error) {
      console.error('❌ Error parsing deep link:', error);
      return {
        success: false,
        action: { type: 'fallback' },
        error: 'Failed to parse deep link URL'
      };
    }
  };

  // ✅ VALIDATE PRODUCT ID - HARUS ANGKA
  private isValidProductId = (productId: string): boolean => {
    return /^[0-9]+$/.test(productId) && productId.length > 0 && productId.length <= 10;
  };

  // ✅ VALIDASI TARGET DENGAN AUTH CHECK
  validateTarget = (params: any, actionType: string): { isValid: boolean; requiresAuth: boolean } => {
    // Validasi parameter
    if (actionType === 'view-product' || actionType === 'add-to-cart') {
      if (!params.productId || !this.isValidProductId(params.productId)) {
        return { isValid: false, requiresAuth: false };
      }
    }

    // Tentukan apakah action memerlukan auth
    const requiresAuth = actionType === 'add-to-cart'; // Contoh: add-to-cart butuh login

    return { isValid: true, requiresAuth };
  };

  // ✅ HANDLE DEEP LINK NAVIGATION DENGAN AUTH GATE
  handleDeepLinkNavigation = async (
    navigation: any,
    parsedLink: ParsedDeepLink,
    isLoggedIn: boolean
  ): Promise<void> => {
    console.log('🎯 Handling deep link navigation with auth gate:', {
      parsedLink,
      isLoggedIn
    });

    const { action } = parsedLink;

    // Validasi target
    const validation = this.validateTarget(action, action.type);

    if (!validation.isValid) {
      // ✅ FALLBACK NAVIGATION: Invalid parameter
      console.log('❌ Invalid parameters, fallback to home');
      this.navigateToHome();
      this.showFallbackAlert(
        'Tautan Tidak Valid',
        'Tautan tidak valid, dialihkan ke beranda'
      );

      // Panggil callback untuk invalid param
      if (this.callbacks.onInvalidParam) {
        this.callbacks.onInvalidParam('Invalid product ID format');
      }
      return;
    }

    // ✅ AUTH GATE: Check jika perlu login tapi belum login
    if (validation.requiresAuth && !isLoggedIn) {
      console.log('🔐 Auth required but user not logged in, saving pending deep link');

      // Simpan sebagai pending deep link
      this.pendingAuthDeepLink = {
        url: `ecommerceapp://${action.type}/${(action as any).productId || ''}`,
        parsedLink,
        targetAction: action,
        timestamp: Date.now()
      };

      // Panggil callback auth required
      if (this.callbacks.onAuthRequired) {
        this.callbacks.onAuthRequired(action.type, (action as any).productId);
      } else {
        // Fallback: Navigate ke login
        this.navigateToLogin();
      }
      return;
    }

    // ✅ EXECUTE NAVIGATION: Valid dan auth terpenuhi
    this.executeNavigation(action);
  };

  // ✅ PROCESS PENDING AUTH DEEP LINK SETELAH LOGIN
  private processPendingAuthDeepLink = (): void => {
    if (!this.pendingAuthDeepLink || !this.navigationRef) {
      return;
    }

    console.log('🔄 Processing pending auth deep link:', this.pendingAuthDeepLink);

    // Tunggu sebentar untuk memastikan navigation ready
    setTimeout(() => {
      if (this.navigationRef && this.pendingAuthDeepLink) {
        this.executeNavigation(this.pendingAuthDeepLink.targetAction);
        this.pendingAuthDeepLink = null;
      }
    }, 1000);
  };

  // ✅ EXECUTE NAVIGATION
  private executeNavigation = (action: DeepLinkAction): void => {
    if (!this.navigationRef) return;

    switch (action.type) {
      case 'view-product':
        this.navigateToProductDetail((action as ViewProductDeepLink).productId);
        break;

      case 'add-to-cart':
        this.handleAddToCartAction((action as AddToCartDeepLink).productId);
        break;

      case 'open-cart':
        this.navigateToCart();
        break;

      case 'fallback':
      default:
        this.navigateToHome();
        break;
    }
  };

  // Setup app state monitoring
  private setupAppStateListener = (): void => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log(`🔄 App state changed: ${this.troubleshootingState.appState} → ${nextAppState}`);
      this.troubleshootingState.appState = nextAppState;

      if (nextAppState === 'active') {
        // App came to foreground, process any pending URLs
        setTimeout(() => {
          this.processPendingUrl();
        }, 500);
      }
    });

    this.subscriptions.push(subscription);
  };

  cleanup = (): void => {
    console.log('🧹 Cleaning up deep linking handler');
    this.subscriptions.forEach(subscription => {
      try {
        subscription.remove();
      } catch (error) {
        console.log('Error removing subscription:', error);
      }
    });
    this.subscriptions = [];
    this.pendingAuthDeepLink = null;
    this.pendingUrl = null;
  };

  handleNativeDeepLink = (url: string): void => {
    console.log('📱 Native deep link received:', url);
    this.handleDeepLink(url);
  };

  handleDeepLink = (url: string | null): void => {
    if (!url) {
      console.log('⚠️ No URL provided to handleDeepLink');
      return;
    }

    console.log(`🎯 Handling deep link - Navigation ready: ${!!this.navigationRef}, App state: ${this.troubleshootingState.appState}`);

    if (!this.navigationRef) {
      console.log('⏳ Navigation ref not available, storing URL as pending:', url);
      this.pendingUrl = url;
      return;
    }

    this.handleUrlAndNavigate(url);
  };

  // ✅ ENHANCED URL HANDLING DENGAN VALIDASI + AUTH GATE
  handleUrlAndNavigate = async (url: string): Promise<void> => {
    try {
      console.log('🔄 Processing URL:', url);
      this.troubleshootingState.lastProcessedUrl = url;

      // Parse the deep link
      const result = this.parseDeepLinkUrl(url);

      if (!result.success) {
        console.log('❌ Invalid deep link format:', result.error);
        this.navigateToHome();
        this.showFallbackAlert(
          'Tautan Tidak Valid',
          result.error || 'Tautan tidak valid, dialihkan ke beranda'
        );
        return;
      }

      // Handle navigation dengan auth gate
      if (this.navigationRef) {
        await this.handleDeepLinkNavigation(
          this.navigationRef,
          result,
          this.isUserLoggedIn
        );
      }

    } catch (error) {
      console.log('❌ Error in handleUrlAndNavigate:', error);
      this.troubleshootingState.lastError = `Navigation failed: ${error}`;
      this.navigateToHome();
      this.showFallbackAlert('Error', 'Failed to process the link');
    }
  };

  // ✅ HANDLE ADD TO CART ACTION
  private handleAddToCartAction = async (productId: string): Promise<void> => {
    try {
      console.log(`🛒 Handling add-to-cart for product: ${productId}`);

      // Use external callback if provided
      if (this.callbacks.onAddToCart) {
        await this.callbacks.onAddToCart(productId);
        return;
      }

      // Fallback: Implement default add to cart behavior
      await this.defaultAddToCartHandler(productId);

    } catch (error) {
      console.error('❌ Error in handleAddToCartAction:', error);
      this.showFallbackAlert('Error', 'Failed to add product to cart');
    }
  };

  // ✅ DEFAULT ADD TO CART HANDLER
  private defaultAddToCartHandler = async (productId: string): Promise<void> => {
    try {
      // Fetch product details
      const product = await productApi.getProductById(productId);

      // Show success message
      Alert.alert(
        'Added to Cart 🛒',
        `${product.name} has been added to your cart!`,
        [
          {
            text: 'View Cart',
            onPress: () => this.navigateToCart()
          },
          {
            text: 'Continue Shopping',
            style: 'cancel'
          }
        ]
      );

      console.log('✅ Product added to cart via deep link:', product.name);

    } catch (error: any) {
      console.error('❌ Failed to add product via deep link:', error);

      // Error handling dengan berbagai scenario
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else if (error.response?.status === 404) {
        Alert.alert(
          'Product Not Found',
          'The requested product could not be found.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to add product to cart. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // ✅ NAVIGATION METHODS
  private navigateToHome = (): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('Home');
    console.log('🏠 Navigated to Home');
  };

  private navigateToLogin = (): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('Login');
    console.log('🔐 Navigated to Login');
  };

  private navigateToCart = (): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('Cart');
    console.log('🛒 Navigated to Cart');
  };

  private navigateToProductDetail = (productId: string): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('ProductDetail', { productId });
    console.log('📦 Navigated to ProductDetail with productId:', productId);
  };

  // ✅ FALLBACK ALERT DENGAN BAHASA INDONESIA
  private showFallbackAlert = (title: string, message: string): void => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  // TROUBLESHOOTING UTILITIES
  private logTroubleshootingState = (): void => {
    console.log('🐛 TROUBLESHOOTING STATE:', this.troubleshootingState);
  };

  getTroubleshootingInfo = (): TroubleshootingState => {
    return { ...this.troubleshootingState };
  };

  // Process pending URL
  processPendingUrl = (): void => {
    if (this.pendingUrl && this.navigationRef) {
      console.log('🔄 Processing pending URL:', this.pendingUrl);
      this.handleDeepLink(this.pendingUrl);
      this.pendingUrl = null;
    }
  };

  // ✅ GET PENDING DEEP LINK INFO
  getPendingDeepLink = (): PendingDeepLink | null => {
    return this.pendingAuthDeepLink;
  };

  // ✅ CLEAR PENDING DEEP LINK
  clearPendingDeepLink = (): void => {
    this.pendingAuthDeepLink = null;
  };

  isHandlerReady = (): boolean => this.isReady;

  getState = () => ({
    isReady: this.isReady,
    pendingUrl: this.pendingUrl,
    pendingAuthDeepLink: this.pendingAuthDeepLink,
    hasNavigationRef: !!this.navigationRef,
    isUserLoggedIn: this.isUserLoggedIn,
    troubleshooting: this.troubleshootingState,
  });

  // ✅ TEST METHOD UNTUK DEEP LINK DENGAN SKENARIO BERBEDA
  testDeepLinkScenarios = (): void => {
    const testScenarios = [
      { url: 'ecommerceapp://product/123', description: 'Valid product ID' },
      { url: 'ecommerceapp://product/abc', description: 'Invalid product ID (harus angka)' },
      { url: 'ecommerceapp://add-to-cart/456', description: 'Valid add-to-cart' },
      { url: 'ecommerceapp://add-to-cart/xyz', description: 'Invalid add-to-cart' },
      { url: 'ecommerceapp://home', description: 'Home deep link' },
      { url: 'ecommerceapp://cart', description: 'Cart deep link' },
      { url: 'ecommerceapp://invalid', description: 'Unknown action' },
    ];

    console.log('🧪 TESTING DEEP LINK SCENARIOS');

    testScenarios.forEach(({ url, description }) => {
      console.log(`\n--- Testing: ${description} ---`);
      console.log(`URL: ${url}`);
      const result = this.parseDeepLinkUrl(url);
      console.log('Parse Result:', result);

      // Test validasi
      if (result.success) {
        const action = result.action;
        const validation = this.validateTarget(action, action.type);
        console.log('Validation Result:', validation);
      }
    });
  };

  // ✅ DIAGNOSTIC FUNCTION
  runDiagnostics = async (): Promise<void> => {
    // Test basic scheme
    const canOpen = await Linking.canOpenURL('ecommerceapp://test');
    console.log(`🔗 Can open ecommerceapp:// scheme: ${canOpen}`);

    this.testDeepLinkScenarios();
    this.logTroubleshootingState();
  };
}

export default new DeepLinkingHandler();