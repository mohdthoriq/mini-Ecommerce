import { Linking, EmitterSubscription, Platform, Alert, AppState } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { NativeModules } from 'react-native';

type DeepLinkParams = Record<string, string>;

interface ParsedDeepLink {
  route: string;
  params: DeepLinkParams;
  pathSegments: string[];
  originalUrl: string;
}

interface TroubleshootingState {
  lastProcessedUrl: string | null;
  lastError: string | null;
  appState: string;
  isColdStart: boolean;
}

class DeepLinkingHandler {
  handleProfileNavigation(pathSegments: string[], params: DeepLinkParams) {
    throw new Error('Method not implemented.');
  }
  private navigationRef: NavigationContainerRef<any> | null = null;
  private isReady: boolean = false;
  private pendingUrl: string | null = null;
  private subscriptions: { remove: () => void }[] = [];
  private troubleshootingState: TroubleshootingState = {
    lastProcessedUrl: null,
    lastError: null,
    appState: 'active',
    isColdStart: true
  };

  setNavigationRef = (ref: NavigationContainerRef<any> | null): void => {
    this.navigationRef = ref;
    if (ref) {
      console.log('✅ Navigation ref set');
      this.processPendingUrl();
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
            const url: string | null = await NativeModules.MainActivity.getStoredDeepLink();
            if (url) {
              console.log('🤖 Android stored deep link:', url);
              initialUrl = url;
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

  // ENHANCED URL HANDLING DENGAN FALLBACK
  handleUrlAndNavigate = async (url: string): Promise<void> => {
    try {
      console.log('🔄 Processing URL:', url);
      this.troubleshootingState.lastProcessedUrl = url;

      // Handle Firebase Dynamic Links
      if (url.includes('ecommerceapp.page.link')) {
        console.log('🔥 Processing Firebase Dynamic Link');
        const resolvedUrl = await this.resolveFirebaseDynamicLink(url);
        if (resolvedUrl) {
          url = resolvedUrl;
          console.log('✅ Resolved Dynamic Link:', url);
        }
      }

      // Handle Universal Links (https)
      if (url.startsWith('https://')) {
        console.log('🌐 Processing Universal Link');
        const mappedUrl = this.mapUniversalLinkToDeepLink(url);
        if (mappedUrl) {
          url = mappedUrl;
          console.log('✅ Mapped Universal Link to:', url);
        }
      }

      const parsedLink = this.parseDeepLink(url);
      
      if (!parsedLink) {
        console.log('❌ Invalid URL format');
        this.showFallbackAlert('Link tidak valid', 'Format URL tidak dikenali');
        this.navigateToHome();
        return;
      }

      const { route, params, pathSegments, originalUrl } = parsedLink;
      const cleanRoute = route.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      console.log(`📍 Route: ${cleanRoute}, Params:`, params);

      // Handle profile dengan userId dari path
      if (cleanRoute === 'profil' || cleanRoute === 'profile') {
        this.handleProfileNavigation(pathSegments, params);
        return;
      }

      // Handle routes lainnya
      switch (cleanRoute) {
        case 'home':
          this.navigateToHome();
          break;
        case 'keranjang':
        case 'cart':
          this.navigateToCart();
          break;
        case 'produk':
        case 'product':
          this.navigateToProductDetail(params);
          break;
        case 'kategorilist':
        case 'categorylist':
          this.navigateToCategoryList();
          break;
        default:
          console.log('❌ Unknown route:', cleanRoute);
          this.showFallbackAlert('Halaman tidak ditemukan', `Route "${cleanRoute}" tidak dikenali`);
          this.navigateToHome();
      }

    } catch (error) {
      console.log('❌ Error in handleUrlAndNavigate:', error);
      this.troubleshootingState.lastError = `Navigation failed: ${error}`;
      this.showFallbackAlert('Error', 'Terjadi kesalahan saat memproses link');
      this.navigateToHome();
    }
  };

  // FIREBASE DYNAMIC LINKS RESOLUTION
  private resolveFirebaseDynamicLink = async (dynamicLinkUrl: string): Promise<string | null> => {
    try {
      // Jika menggunakan Firebase, install @react-native-firebase/dynamic-links
      // const resolvedLink = await dynamicLinks().resolveLink(dynamicLinkUrl);
      // return resolvedLink.url;
      
      // Fallback: Extract deep link dari Firebase URL pattern
      if (dynamicLinkUrl.includes('link=')) {
        const match = dynamicLinkUrl.match(/link=([^&]+)/);
        if (match) {
          const decodedUrl = decodeURIComponent(match[1]);
          console.log('🔗 Extracted deep link from Firebase URL:', decodedUrl);
          return decodedUrl;
        }
      }
      
      return null;
    } catch (error) {
      console.log('❌ Error resolving Firebase Dynamic Link:', error);
      return null;
    }
  };

  // UNIVERSAL LINKS MAPPING
  private mapUniversalLinkToDeepLink = (universalLink: string): string | null => {
    try {
      const urlObj = new URL(universalLink);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname;
      
      console.log(`🌐 Mapping Universal Link: ${hostname}${pathname}`);
      
      // Map berbagai domain ke deep link scheme
      if (hostname === 'ecommerceapp.com' || hostname === 'www.ecommerceapp.com') {
        const deepLink = `ecommerceapp://${pathname.replace(/^\//, '')}${urlObj.search}`;
        console.log(`✅ Mapped to: ${deepLink}`);
        return deepLink;
      }
      
      return null;
    } catch (error) {
      console.log('❌ Error mapping universal link:', error);
      return null;
    }
  };

  // ENHANCED URL PARSING
  private parseDeepLink = (url: string): ParsedDeepLink | null => {
    try {
      console.log('🔍 Parsing URL:', url);
      
      let route = '';
      let pathSegments: string[] = [];
      const params: DeepLinkParams = {};

      // Handle custom scheme
      if (url.startsWith('ecommerceapp://')) {
        const withoutScheme = url.replace('ecommerceapp://', '');
        const [pathPart, queryPart] = withoutScheme.split('?');
        pathSegments = pathPart.split('/').filter(segment => segment.length > 0);
        route = pathSegments[0] || '';
        
        // Parse query parameters
        if (queryPart) {
          const pairs = queryPart.split('&');
          pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
              params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
          });
        }
      }
      // Handle https scheme (setelah mapping)
      else if (url.startsWith('https://')) {
        console.log('⚠️ HTTPS URL not properly mapped:', url);
        return null;
      }
      else {
        console.log('❌ Unsupported URL scheme:', url);
        return null;
      }

      console.log(`📊 Parsed - Route: ${route}, Segments:`, pathSegments, 'Params:', params);
      
      return { route, params, pathSegments, originalUrl: url };
    } catch (error) {
      console.log('❌ Error in parseDeepLink:', error);
      return null;
    }
  };

  // VALIDASI USER ID YANG LEBIH ROBUST
  private isValidUserId = (userId: string): boolean => {
    try {
      // Minimal 3 karakter, maksimal 50 karakter
      if (userId.length < 3 || userId.length > 50) {
        console.log(`❌ User ID length invalid: ${userId.length} characters`);
        return false;
      }

      // Hanya alphanumeric, underscore, atau dash
      const validPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validPattern.test(userId)) {
        console.log(`❌ User ID contains invalid characters: ${userId}`);
        return false;
      }

      // Cek reserved words
      const reservedWords = ['admin', 'system', 'root', 'null', 'undefined'];
      if (reservedWords.includes(userId.toLowerCase())) {
        console.log(`❌ User ID is reserved word: ${userId}`);
        return false;
      }

      console.log(`✅ User ID valid: ${userId}`);
      return true;
    } catch (error) {
      console.log('❌ Error validating user ID:', error);
      return false;
    }
  };

  // FALLBACK ALERT
  private showFallbackAlert = (title: string, message: string): void => {
    if (Platform.OS === 'ios') {
      // Di iOS, Alert work lebih baik
      Alert.alert(title, message);
    } else {
      // Di Android, bisa gunakan Toast atau console log saja
      console.log(`⚠️ ${title}: ${message}`);
      // Atau implementasi Toast Android
      // ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  // NAVIGATION METHODS (tetap sama)
  private navigateToHome = (): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('RootDrawer', { screen: 'Home' });
    console.log('🏠 Navigated to Home');
  };

  private navigateToCart = (): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('RootDrawer', { screen: 'Cart' });
    console.log('🛒 Navigated to Cart');
  };

  private navigateToProductDetail = (params: DeepLinkParams): void => {
    if (!this.navigationRef) return;
    if (!params.productId) {
      console.log('⚠️ Product ID missing for ProductDetail');
      this.navigateToHome();
      return;
    }
    this.navigationRef.navigate('ProductDetail', { productId: params.productId });
    console.log('📦 Navigated to ProductDetail with productId:', params.productId);
  };

  private navigateToProfile = (): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('RootDrawer', { screen: 'Profile' });
    console.log('👤 Navigated to Profile (default)');
  };

  private navigateToProfileWithUserId = (userId: string): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('RootDrawer', { screen: 'Profile', params: { userId } });
    console.log(`👤 Navigated to Profile with userId: ${userId}`);
  };

  private navigateToCategoryList = (): void => {
    if (!this.navigationRef) return;
    this.navigationRef.navigate('RootDrawer', { screen: 'CategoryList' });
    console.log('🗂️ Navigated to CategoryList');
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

  isHandlerReady = (): boolean => this.isReady;

  getState = () => ({
    isReady: this.isReady,
    pendingUrl: this.pendingUrl,
    hasNavigationRef: !!this.navigationRef,
    troubleshooting: this.troubleshootingState,
  });

  // TEST METHOD UNTUK DEBUGGING
  testDeepLink = (url: string): void => {
    console.log('🧪 Testing deep link:', url);
    this.handleUrlAndNavigate(url);
  };

  // DIAGNOSTIC FUNCTION
  runDiagnostics = async (): Promise<void> => {
    console.log('🩺 RUNNING DEEP LINK DIAGNOSTICS');
    
    // Test basic scheme
    const canOpen = await Linking.canOpenURL('ecommerceapp://test');
    console.log(`🔗 Can open ecommerceapp:// scheme: ${canOpen}`);
    
    // Test URLs
    const testUrls = [
      'ecommerceapp://profil/user123',
      'https://ecommerceapp.com/profil/user123',
      'ecommerceapp://home',
      'invalid-url'
    ];
    
    for (const url of testUrls) {
      console.log(`\n--- Testing: ${url} ---`);
      await this.testDeepLink(url);
    }
    
    this.logTroubleshootingState();
  };
}

export default new DeepLinkingHandler();