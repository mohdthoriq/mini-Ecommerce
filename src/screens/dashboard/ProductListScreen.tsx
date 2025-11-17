import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList, Product, ApiProduct } from '../../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useInternet } from '../../context/InternetContext';
import { useNetworkAwareAction } from '../../hooks/useNetworkAwareAction';
import { cacheManager } from '../../utils/cachehelper';

type ProductListScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'ProductList'>;

// Cache keys
const PRODUCTS_CACHE_KEY = 'products_cache';
const CATEGORIES_CACHE_KEY = 'categories_cache';

const ProductListScreen = () => {
  const navigation = useNavigation<ProductListScreenNavigationProp>();
  const { isInternetReachable } = useInternet();
  const { executeIfOnline } = useNetworkAwareAction();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Exponential Backoff State
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [isRetrying, setIsRetrying] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  // Convert API product to our Product interface
  const convertApiProduct = (apiProduct: ApiProduct): Product => {
    return {
      id: apiProduct.id.toString(),
      name: apiProduct.title,
      title: apiProduct.title,
      price: apiProduct.price,
      category: apiProduct.category,
      description: apiProduct.description,
      image: apiProduct.thumbnail,
      discount: apiProduct.discountPercentage,
      isNew: apiProduct.stock > 50
    };
  };

  // Save products to cache
  const saveProductsToCache = async (products: Product[]) => {
    await cacheManager.set(PRODUCTS_CACHE_KEY, products);
    
    // Also save categories separately for faster access
    const categories = ['all', ...new Set(products.map(product => product.category))];
    await cacheManager.set(CATEGORIES_CACHE_KEY, categories);
  };

  // Load products from cache
  const loadProductsFromCache = async (): Promise<Product[] | null> => {
    return await cacheManager.get<Product[]>(PRODUCTS_CACHE_KEY);
  };

  // Load categories from cache
  const loadCategoriesFromCache = async (): Promise<string[] | null> => {
    return await cacheManager.get<string[]>(CATEGORIES_CACHE_KEY);
  };

  // Exponential Backoff Delay Calculator
  const getRetryDelay = (attempt: number): number => {
    return Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
  };

  // Fetch products from API with Cache-First Strategy
  const fetchProducts = async (isManualRetry: boolean = false, forceRefresh: boolean = false) => {
    try {
      // Check internet connection before attempting fetch
      if (!isInternetReachable) {
        // Try to load from cache when offline
        const cachedProducts = await loadProductsFromCache();
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setError('Mode offline - menggunakan data cache');
          setUsingCache(true);
          console.log('📱 Offline mode: Using cached products');
        } else {
          setError('Tidak ada koneksi internet dan tidak ada data cache.');
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Reset states for new attempt
      if (isManualRetry) {
        setRetryCount(0);
        setError(null);
        setIsRetrying(false);
        setUsingCache(false);
      }

      setLoading(true);

      // Cache-First Strategy: Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedProducts = await loadProductsFromCache();
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setUsingCache(true);
          console.log('💾 Using cached products');
          
          // Continue to fetch fresh data in background
          fetchFreshProducts();
          return;
        }
      }

      // No cache or force refresh - fetch from API
      await fetchFreshProducts();

    } catch (err: unknown) {
      handleFetchError(err);
    }
  };

  // Fetch fresh products from API
  const fetchFreshProducts = async () => {
    const currentAttempt = retryCount + 1;
    console.log(`🔄 Fetch attempt ${currentAttempt}/${maxRetries + 1}`);

    try {
      await executeIfOnline(async () => {
        const response = await fetch('https://dummyjson.com/products');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.products) {
          // Convert API products to our Product format
          const convertedProducts: Product[] = data.products.map((apiProduct: ApiProduct) =>
            convertApiProduct(apiProduct)
          );

          setProducts(convertedProducts);
          setFilteredProducts(convertedProducts);
          setError(null);
          setRetryCount(0);
          setIsRetrying(false);
          setUsingCache(false);

          // Save to cache
          await saveProductsToCache(convertedProducts);

          console.log('✅ Products loaded successfully and cached');
        }
      }, {
        showAlert: false,
        alertMessage: 'Tidak dapat memuat produk saat offline.'
      });

    } catch (err: unknown) {
      // If API fails, try to use cache as fallback
      const cachedProducts = await loadProductsFromCache();
      if (cachedProducts && cachedProducts.length > 0) {
        setProducts(cachedProducts);
        setFilteredProducts(cachedProducts);
        setUsingCache(true);
        setError('Gagal memuat data terbaru, menggunakan data cache');
        console.log('🔄 Fallback to cached data after API failure');
      } else {
        throw err; // Re-throw if no cache available
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle fetch errors
  const handleFetchError = async (err: unknown) => {
    console.error(`❌ Fetch attempt ${retryCount + 1} failed:`, err);

    let errorMessage = 'Unknown error occurred';

    // Handle different error types
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = String((err as any).message);
    }

    // Try cache as fallback
    const cachedProducts = await loadProductsFromCache();
    if (cachedProducts && cachedProducts.length > 0) {
      setProducts(cachedProducts);
      setFilteredProducts(cachedProducts);
      setUsingCache(true);
      setError('Gagal memuat data terbaru, menggunakan data cache');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Handle network-specific errors
    if (errorMessage === 'NO_INTERNET_CONNECTION') {
      setError('Tidak ada koneksi internet. Periksa koneksi Anda.');
      setIsRetrying(false);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Check if we should retry (only if we have internet)
    if (retryCount < maxRetries && isInternetReachable) {
      const delay = getRetryDelay(retryCount);
      const nextAttempt = retryCount + 2;

      console.log(`⏳ Retrying in ${delay / 1000}s... (Attempt ${nextAttempt})`);
      setIsRetrying(true);

      // Show temporary error message
      setError(`Gagal memuat produk. Mencoba lagi dalam ${delay / 1000} detik... (${retryCount + 1}/${maxRetries})`);

      // Schedule retry with exponential backoff
      setTimeout(() => {
        console.log(`🚀 Executing auto-retry ${nextAttempt}`);
        setRetryCount(prev => prev + 1);
      }, delay);
    } else {
      // Max retries reached or no internet - show permanent error
      setIsRetrying(false);
      if (!isInternetReachable) {
        setError('Tidak ada koneksi internet. Periksa koneksi Anda.');
      } else {
        setError(`Gagal memuat produk setelah ${maxRetries + 1} percobaan. ${errorMessage}`);
      }
      console.error(`💥 All ${maxRetries + 1} attempts failed`);
    }
  };

  // Manual retry function with network check
  const handleManualRetry = () => {
    console.log('🔄 Manual retry triggered', { isOnline: isInternetReachable });

    if (!isInternetReachable) {
      Alert.alert(
        'Tidak Terkoneksi',
        'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.',
        [{ text: 'OK' }]
      );
      return;
    }

    fetchProducts(true, true); // Force refresh on manual retry
  };

  // Clear cache and refresh
  const handleClearCache = async () => {
    await cacheManager.remove(PRODUCTS_CACHE_KEY);
    await cacheManager.remove(CATEGORIES_CACHE_KEY);
    Alert.alert('Success', 'Cache cleared successfully');
    fetchProducts(false, true);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Trigger automatic retry when retryCount changes (only if online)
  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries && isInternetReachable) {
      fetchProducts();
    }
  }, [retryCount, isInternetReachable]);

  // Handle network connection recovery
  useEffect(() => {
    if (isInternetReachable && error && error.includes('Tidak ada koneksi internet')) {
      console.log('🌐 Connection recovered, auto-retrying...');
      setError('Koneksi pulih. Memuat ulang produk...');
      setTimeout(() => {
        fetchProducts(true, true);
      }, 1000);
    }
  }, [isInternetReachable]);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const onRefresh = () => {
    if (!isInternetReachable) {
      Alert.alert(
        'Tidak Terkoneksi',
        'Tidak dapat refresh produk saat offline.',
        [{ text: 'OK' }]
      );
      return;
    }

    setRefreshing(true);
    setRetryCount(0);
    setError(null);
    setIsRetrying(false);
    setUsingCache(false);
    fetchProducts(false, true); // Force refresh on pull-to-refresh
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const getCategories = () => {
    const categories = ['all', ...new Set(products.map(product => product.category))];
    return categories;
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const calculateDiscountPrice = (price: number, discount?: number) => {
    if (!discount) return price;
    return price - (price * discount / 100);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />

      {item.discount && item.discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{Math.round(item.discount)}%</Text>
        </View>
      )}

      {item.isNew && (
        <View style={styles.newBadge}>
          <Text style={styles.newText}>NEW</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.productCategory}>
          {item.category}
        </Text>

        <View style={styles.priceContainer}>
          {item.discount && item.discount > 0 ? (
            <>
              <Text style={styles.originalPrice}>
                {formatPrice(item.price)}
              </Text>
              <Text style={styles.discountPrice}>
                {formatPrice(calculateDiscountPrice(item.price, item.discount))}
              </Text>
            </>
          ) : (
            <Text style={styles.normalPrice}>
              {formatPrice(item.price)}
            </Text>
          )}
        </View>

        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryChip = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryChip,
        selectedCategory === category && styles.categoryChipSelected
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.categoryTextSelected
      ]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  // Show permanent error UI after all retries failed or no internet
  if (error && !isRetrying && (retryCount >= maxRetries || !isInternetReachable)) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome6
          name={isInternetReachable ? "triangle-exclamation" : "wifi"}
          size={64}
          color={isInternetReachable ? "#ff6b6b" : "#6b7280"}
          iconStyle='solid'
        />
        <Text style={styles.errorTitle}>
          {isInternetReachable ? 'Gagal Memuat Produk' : 'Tidak Terkoneksi'}
        </Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.retryInfo}>
          {!isInternetReachable
            ? 'Sambungkan perangkat Anda ke internet'
            : `${maxRetries + 1} percobaan otomatis telah dilakukan`
          }
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            !isInternetReachable && styles.retryButtonOffline
          ]}
          onPress={handleManualRetry}
        >
          <Text style={styles.retryButtonText}>
            {isInternetReachable ? 'Coba Lagi Manual' : 'Coba Lagi'}
          </Text>
        </TouchableOpacity>
        {usingCache && (
          <Text style={styles.cacheIndicator}>
            📱 Sedang menggunakan data cache
          </Text>
        )}
      </View>
    );
  }

  // Show loading with retry info during retries
  if (loading || isRetrying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>
          {isRetrying
            ? `Mencoba lagi... (${retryCount + 1}/${maxRetries})`
            : usingCache ? 'Memuat data cache...' : 'Loading products...'
          }
        </Text>
        {isRetrying && (
          <Text style={styles.retryInfo}>
            Percobaan otomatis {retryCount + 1} dari {maxRetries}
          </Text>
        )}
        {error && isRetrying && (
          <Text style={styles.retryDetail}>{error}</Text>
        )}
        {!isInternetReachable && (
          <Text style={styles.offlineWarning}>
            ⚠️ Sedang offline - menunggu koneksi...
          </Text>
        )}
        {usingCache && (
          <Text style={styles.cacheIndicator}>
            💾 Menggunakan data cache
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Network Status Indicator */}
      {!isInternetReachable && (
        <View style={styles.offlineIndicator}>
          <FontAwesome6 name="wifi" size={14} color="#ffffff" iconStyle='solid' />
          <Text style={styles.offlineIndicatorText}>Mode Offline</Text>
        </View>
      )}

      {/* Cache Status Indicator */}
      {usingCache && (
        <View style={styles.cacheBanner}>
          <FontAwesome6 name="database" size={14} color="#ffffff" iconStyle='solid' />
          <Text style={styles.cacheBannerText}>Menggunakan data cache</Text>
          <TouchableOpacity onPress={handleClearCache} style={styles.clearCacheButton}>
            <Text style={styles.clearCacheText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Temporary Error Banner during retries */}
      {error && isRetrying && (
        <View style={styles.retryBanner}>
          <FontAwesome6 name="clock-rotate-left" size={16} color="#fff" iconStyle='solid' />
          <Text style={styles.retryBannerText}>{error}</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={[
        styles.searchContainer,
        !isInternetReachable && styles.searchContainerOffline
      ]}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#666" iconStyle='solid' />
        <TextInput
          style={styles.searchInput}
          placeholder={isInternetReachable ? "Search products..." : "Search (offline mode)"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          editable={isInternetReachable || products.length > 0}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome6 name="xmark" size={16} color="#666" iconStyle='solid' />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={getCategories()}
          renderItem={({ item }) => renderCategoryChip(item)}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Products Count with Online Status */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredProducts.length} products found
          {!isInternetReachable && ' • Offline'}
          {usingCache && ' • Cache'}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productsRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2e7d32']}
            enabled={isInternetReachable}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6
              name={isInternetReachable ? "box-open" : "wifi"}
              size={64}
              color="#ccc"
              iconStyle='solid'
            />
            <Text style={styles.emptyText}>
              {isInternetReachable ? 'No products found' : 'Tidak Terkoneksi'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isInternetReachable
                ? 'Try adjusting your search or filter'
                : 'Sambungkan ke internet untuk memuat produk'
              }
            </Text>
          </View>
        }
        contentContainerStyle={styles.productsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7f0',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2e7d32',
    textAlign: 'center',
  },
  offlineWarning: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7f0',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  retryInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  retryDetail: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonOffline: {
    backgroundColor: '#6b7280',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryBanner: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  offlineIndicator: {
    backgroundColor: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  offlineIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainerOffline: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  productsList: {
    paddingBottom: 16,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '48%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  discountPrice: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  normalPrice: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 11,
    color: '#888',
    lineHeight: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  cacheBanner: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cacheBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  clearCacheButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearCacheText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cacheIndicator: {
    fontSize: 14,
    color: '#ff9800',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default ProductListScreen;