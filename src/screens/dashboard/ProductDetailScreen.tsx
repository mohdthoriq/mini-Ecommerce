import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { productApi } from '../../services/api/productApi';
import { productCacheService } from '../../services/product/productCacheService';
import ResetStackButton from '../../components/ResetStackButton';
import { fetchWithRetry } from '../../utils/fetchWithRetry'; 

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;

// Fallback product data untuk error 404/500
const FALLBACK_PRODUCT: Product = {
  id: "fallback",
  name: "Produk Arsip",
  title: "Produk Arsip",
  image: "https://dummyimage.com/300x300/cccccc/000000",
  price: 0,
  description: "Ini adalah versi arsip produk. Data terbaru tidak dapat dimuat.",
  category: "Archive",
  stock: 0,
  rating: 0
};

const ProductDetailScreen = () => {
  const { addToCart } = useCart();
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute();
  const { productId } = route.params as { productId: string };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // ✅ Track retry attempts

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  /**
   * ✅ FETCH PRODUCT DETAIL DENGAN RETRY MECHANISM
   */
  const fetchProductDetail = async (isRefreshing: boolean = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      setShowFallback(false);
      setHttpStatus(null);
      setRetryCount(0); // Reset retry count
      
      if (!isRefreshing) {
        setUsingCache(false);
      }

      console.log('🔄 Fetching product details for ID:', productId);

      // ✅ JIKA SEDANG REFRESH, SKIP CACHE & FORCE API CALL
      const cachedProduct = isRefreshing ? null : await productCacheService.getProductCache<Product>(productId);
      
      if (cachedProduct && !isRefreshing) {
        console.log('✅ Using cached product data');
        setProduct(cachedProduct);
        setUsingCache(true);
        setLoading(false);
        return;
      }

      // ✅ FETCH FROM API DENGAN RETRY MECHANISM
      console.log(isRefreshing ? '🔄 Force refreshing from API...' : '🌐 Cache miss, fetching from API...');
      
      const productData = await fetchWithRetry(
        async () => {
          const result = await productApi.getProductById(productId);
          setRetryCount(prev => prev + 1); // Track successful attempt
          return result;
        },
        { 
          maxRetry: 3, 
          baseDelay: 1000,
          retryOn5xx: true 
        }
      );
      
      // ✅ SAVE TO CACHE
      await productCacheService.setProductCache(productId, productData);
      
      setProduct(productData);
      setUsingCache(false);
      
      console.log(isRefreshing ? '✅ Product data refreshed and cache updated' : '✅ Product details loaded from API and cached');
      
    } catch (err: any) {
      console.error('❌ Error fetching product after retries:', err);
      
      const status = err.response?.status;
      setHttpStatus(status);
      setRetryCount(0); // Reset karena gagal
      
      // ✅ JIKA REFRESH GAGAL, COBA PAKAI CACHE SEBAGAI FALLBACK
      const cachedProduct = await productCacheService.getProductCache<Product>(productId);
      if (cachedProduct) {
        console.log('🔄 Using cached data as fallback after API error');
        setProduct(cachedProduct);
        setUsingCache(true);
        setError(isRefreshing ? 'Refresh failed, using cached data' : 'Using cached data (offline mode)');
        
        if (isRefreshing) {
          Alert.alert(
            'Refresh Failed', 
            'Failed to refresh data. Using cached version instead.'
          );
        }
      } else {
        setError(err.message || 'Failed to load product details');
        
        if (status === 404 || status === 500) {
          setShowFallback(true);
          setProduct(FALLBACK_PRODUCT);
          
          if (isRefreshing) {
            Alert.alert(
              'Refresh Failed', 
              'Gagal memuat data terbaru setelah beberapa percobaan. Menampilkan versi arsip.'
            );
          } else {
            Alert.alert(
              'Connection Issue', 
              'Gagal memuat data produk setelah beberapa percobaan. Menampilkan versi arsip.'
            );
          }
        } else if (isRefreshing) {
          Alert.alert(
            'Refresh Failed', 
            'Failed to refresh product data after several attempts'
          );
        } else {
          Alert.alert(
            'Connection Error', 
            'Failed to load product details. Please check your connection.'
          );
        }
      }
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  /**
   * ✅ PULL-TO-REFRESH HANDLER DENGAN RETRY
   */
  const onRefresh = () => {
    console.log('🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    fetchProductDetail(true);
  };

  /**
   * ✅ MANUAL RETRY HANDLER
   */
  const handleManualRetry = () => {
    console.log('🔄 Manual retry triggered');
    fetchProductDetail(false);
  };

  /**
   * CLEAR CACHE FOR THIS PRODUCT
   */
  const clearProductCache = async () => {
    await productCacheService.clearProductCache(productId);
    Alert.alert('Cache Cleared', 'Product cache has been cleared.');
    setUsingCache(false);
  };

  const handleBackToDrawerHome = () => {
    navigation.navigate('Home');
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.id === "fallback") {
      Alert.alert('Info', 'Produk arsip tidak dapat ditambahkan ke keranjang.');
      return;
    }
    
    addToCart(product);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    if (product.id === "fallback") {
      Alert.alert('Info', 'Produk arsip tidak dapat dibeli.');
      return;
    }
    
    addToCart(product, 1);
  };

  // ✅ HELPER FUNCTION UNTUK GET PRODUCT NAME
  const getProductName = (product: Product): string => {
    return product.title || product.name || 'Product Name Not Available';
  };

  // ✅ HELPER FUNCTION UNTUK GET PRODUCT IMAGE
  const getProductImage = (product: Product): string => {
    return product.image || product.thumbnail || FALLBACK_PRODUCT.image!;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>
          {usingCache ? 'Loading from cache...' : 'Loading product details...'}
        </Text>
        {retryCount > 0 && (
          <Text style={styles.retryInfoText}>
            Attempt {retryCount} of 4
          </Text>
        )}
      </View>
    );
  }

  const displayProduct = showFallback ? product : product;
  
  if ((error && !showFallback && !usingCache) || !displayProduct) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to Load Product</Text>
        <Text style={styles.errorText}>
          {httpStatus ? `HTTP ${httpStatus} Error` : 'Network Error'}
        </Text>
        <Text style={styles.errorDescription}>
          {error || 'Unable to load product details after several retry attempts.'}
        </Text>
        
        <View style={styles.errorActions}>
          <TouchableOpacity 
            style={[styles.retryButton, styles.primaryRetryButton]} 
            onPress={handleManualRetry}
          >
            <Text style={styles.primaryRetryButtonText}>🔄 Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        
        {/* Debug info for developers */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Product ID: {productId}</Text>
            <Text style={styles.debugText}>HTTP Status: {httpStatus || 'N/A'}</Text>
            <Text style={styles.debugText}>Error: {error}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2e7d32']}
          tintColor="#2e7d32"
          title="Pull to refresh..."
          titleColor="#666"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Cache Status Banner */}
      {usingCache && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>
            💾 Using Cached Data
          </Text>
          <TouchableOpacity onPress={clearProductCache} style={styles.clearCacheButton}>
            <Text style={styles.clearCacheText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Retry Success Banner */}
      {retryCount > 1 && !usingCache && (
        <View style={styles.retrySuccessBanner}>
          <Text style={styles.retrySuccessText}>
            ✅ Loaded after {retryCount} attempts
          </Text>
        </View>
      )}

      {/* Fallback Product Banner */}
      {showFallback && (
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackBannerText}>
            ⚠️ Showing Archived Version
          </Text>
        </View>
      )}

      {/* HTTP Status Debug Info */}
      {__DEV__ && httpStatus && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            HTTP Status: {httpStatus} | {httpStatus === 404 ? 'Not Found' : httpStatus === 500 ? 'Server Error' : 'Other Error'}
          </Text>
        </View>
      )}

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getProductImage(displayProduct) }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.badgeContainer}>
          {displayProduct.isNew && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {displayProduct.discount && displayProduct.discount > 0 && (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>{Math.round(displayProduct.discount)}% OFF</Text>
            </View>
          )}
          {showFallback && (
            <View style={[styles.badge, styles.fallbackBadge]}>
              <Text style={styles.badgeText}>ARCHIVE</Text>
            </View>
          )}
          {usingCache && (
            <View style={[styles.badge, styles.cacheBadge]}>
              <Text style={styles.badgeText}>CACHE</Text>
            </View>
          )}
          {retryCount > 1 && (
            <View style={[styles.badge, styles.retryBadge]}>
              <Text style={styles.badgeText}>RETRY {retryCount}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{displayProduct.category?.toUpperCase() || 'PRODUCT'}</Text>
        
        <Text style={styles.name}>{getProductName(displayProduct)}</Text>
        
        <Text style={styles.price}>
          {displayProduct.price > 0 ? `$${displayProduct.price.toLocaleString()}` : 'Price not available'}
        </Text>
        
        <View style={styles.stockContainer}>
          <Text style={[
            styles.stockText, 
            (displayProduct.stock ?? 0) > 0 ? styles.inStock : styles.outOfStock
          ]}>
            {(displayProduct.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>
          {usingCache && (
            <Text style={styles.cacheHint}>
              💡 Pull down to refresh data
            </Text>
          )}
        </View>

        <Text style={styles.description}>{displayProduct.description}</Text>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[
              styles.cartButton,
              ((displayProduct.stock ?? 0) === 0 || showFallback) && styles.disabledButton
            ]} 
            onPress={handleAddToCart}
            disabled={(displayProduct.stock ?? 0) === 0 || showFallback}
          >
            <Text style={styles.cartButtonText}>
              {showFallback ? 'Archived Product' : 
               (displayProduct.stock ?? 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.buyButton,
              ((displayProduct.stock ?? 0) === 0 || showFallback) && styles.disabledButton
            ]} 
            onPress={handleBuyNow}
            disabled={(displayProduct.stock ?? 0) === 0 || showFallback}
          >
            <Text style={styles.buyButtonText}>
              {showFallback ? 'Not Available' : 
               (displayProduct.stock ?? 0) === 0 ? 'Out of Stock' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={handleBackToDrawerHome}
          >
            <Text style={styles.navButtonText}>Back to Home</Text>
          </TouchableOpacity>
          
          <ResetStackButton />
        </View>

        {/* Refresh Hint */}
        <View style={styles.refreshHintContainer}>
          <Text style={styles.refreshHintText}>
            💡 Pull down from top to refresh product data
          </Text>
          <Text style={styles.retryHintText}>
            🔄 Automatic retry on network failures
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  retryInfoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff5722',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff5722',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  primaryRetryButton: {
    backgroundColor: '#2e7d32',
  },
  primaryRetryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
  cacheBanner: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'space-between',
  },
  cacheBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  retrySuccessBanner: {
    backgroundColor: '#4caf50',
    padding: 12,
    alignItems: 'center',
  },
  retrySuccessText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearCacheButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearCacheText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cacheBadge: {
    backgroundColor: '#ff9800',
  },
  retryBadge: {
    backgroundColor: '#2196f3',
  },
  fallbackBanner: {
    backgroundColor: '#ff9800',
    padding: 12,
    alignItems: 'center',
  },
  fallbackBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: '#ffffff',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newBadge: {
    backgroundColor: '#4caf50',
  },
  discountBadge: {
    backgroundColor: '#ff5722',
  },
  fallbackBadge: {
    backgroundColor: '#9e9e9e',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  category: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  stockContainer: {
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inStock: {
    color: '#4caf50',
  },
  outOfStock: {
    color: '#ff5722',
  },
  cacheHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#d8f7dbff',
    borderWidth: 2,
    borderColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navigationButtons: {
    gap: 12,
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshHintContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  refreshHintText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  retryHintText: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProductDetailScreen;