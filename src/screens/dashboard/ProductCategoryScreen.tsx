import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList, Product, ApiProduct } from '../../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import  { useInternet }  from '../../context/InternetContext';
import { cacheManager } from '../../utils/cacheHelper';
import WishlistButton from '../../routes/WishlistButton';

type ProductCategoryScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'ProductCategory'>;

// Cache keys
const CATEGORY_PRODUCTS_CACHE_KEY = 'category_products_cache';

const ProductCategoryScreen = () => {
  const navigation = useNavigation<ProductCategoryScreenNavigationProp>();
  const route = useRoute();
  const { category } = route.params as { category: string };
  const { isInternetReachable } = useInternet();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      rating: apiProduct.rating,
      stock: apiProduct.stock,
      isNew: apiProduct.stock > 50
    };
  };

  // Save category products to cache
  const saveCategoryProductsToCache = async (category: string, products: Product[]) => {
    const cacheKey = `${CATEGORY_PRODUCTS_CACHE_KEY}_${category}`;
    await cacheManager.set(cacheKey, products);
  };

  // Load category products from cache
  const loadCategoryProductsFromCache = async (category: string): Promise<Product[] | null> => {
    const cacheKey = `${CATEGORY_PRODUCTS_CACHE_KEY}_${category}`;
    return await cacheManager.get<Product[]>(cacheKey);
  };

  // Fetch products by category with Cache-First Strategy
  const fetchCategoryProducts = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check internet connection
      if (!isInternetReachable) {
        // Try to load from cache when offline
        const cachedProducts = await loadCategoryProductsFromCache(category);
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setError('Mode offline - menggunakan data cache');
          setUsingCache(true);
          console.log(`📱 Offline mode: Using cached products for ${category}`);
        } else {
          setError('Tidak ada koneksi internet dan tidak ada data cache.');
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Cache-First Strategy: Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedProducts = await loadCategoryProductsFromCache(category);
        if (cachedProducts && cachedProducts.length > 0) {
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          setUsingCache(true);
          console.log(`💾 Using cached products for category: ${category}`);
          
          // Continue to fetch fresh data in background
          fetchFreshCategoryProducts();
          return;
        }
      }

      // No cache or force refresh - fetch from API
      await fetchFreshCategoryProducts();

    } catch (err: unknown) {
      handleFetchError(err);
    }
  };

  // Fetch fresh category products from API
  const fetchFreshCategoryProducts = async () => {
    try {
      console.log(`🔄 Fetching fresh products for category: ${category}`);
      
      const response = await fetch(`https://dummyjson.com/products/category/${category}`);
      
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
        setUsingCache(false);
        setError(null);

        // Save to cache
        await saveCategoryProductsToCache(category, convertedProducts);
        
        console.log(`✅ Category products loaded and cached: ${category}`);
      }
    } catch (err: unknown) {
      // If API fails, try to use cache as fallback
      const cachedProducts = await loadCategoryProductsFromCache(category);
      if (cachedProducts && cachedProducts.length > 0) {
        setProducts(cachedProducts);
        setFilteredProducts(cachedProducts);
        setUsingCache(true);
        setError('Gagal memuat data terbaru, menggunakan data cache');
        console.log(`🔄 Fallback to cached data for ${category} after API failure`);
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
    console.error(`❌ Fetch failed for category ${category}:`, err);

    let errorMessage = 'Gagal memuat produk kategori';

    // Handle different error types
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    // Try cache as fallback
    const cachedProducts = await loadCategoryProductsFromCache(category);
    if (cachedProducts && cachedProducts.length > 0) {
      setProducts(cachedProducts);
      setFilteredProducts(cachedProducts);
      setUsingCache(true);
      setError('Gagal memuat data terbaru, menggunakan data cache');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(errorMessage);
    setLoading(false);
    setRefreshing(false);
  };

  // Manual retry
  const handleRetry = () => {
    fetchCategoryProducts(true);
  };

  // Clear cache for this category
  const handleClearCache = async () => {
    const cacheKey = `${CATEGORY_PRODUCTS_CACHE_KEY}_${category}`;
    await cacheManager.remove(cacheKey);
    Alert.alert('Success', 'Cache cleared successfully');
    fetchCategoryProducts(true);
  };

  // Pull to refresh
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
    setError(null);
    setUsingCache(false);
    fetchCategoryProducts(true);
  };

  useEffect(() => {
    fetchCategoryProducts();
  }, [category]);

  // Filter products based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
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

      {/* --- TOMBOL WISHLIST --- */}
      <View style={styles.wishlistButtonContainer}>
        <WishlistButton product={item} size={20} />
      </View>

      {/* --- BADGE (NEW & DISCOUNT) --- */}
      {/* (Logika badge bisa ditambahkan di sini jika perlu) */}
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

        {item.rating && (
          <View style={styles.ratingContainer}>
            <FontAwesome6 name="star" size={12} color="#ffc107" iconStyle='solid' />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        )}

        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>
          {usingCache ? 'Memuat data cache...' : `Loading ${category}...`}
        </Text>
        {usingCache && (
          <Text style={styles.cacheIndicator}>💾 Menggunakan data cache</Text>
        )}
      </View>
    );
  }

  if (error && filteredProducts.length === 0) {
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
        <TouchableOpacity
          style={[
            styles.retryButton,
            !isInternetReachable && styles.retryButtonOffline
          ]}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>
            {isInternetReachable ? 'Coba Lagi' : 'Coba Lagi'}
          </Text>
        </TouchableOpacity>
        {usingCache && (
          <Text style={styles.cacheIndicator}>📱 Sedang menggunakan data cache</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome6 name="arrow-left" size={20} color="#2e7d32" iconStyle='solid' />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.categoryTitle}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
          <Text style={styles.productCount}>
            {filteredProducts.length} products
            {usingCache && ' • Cache'}
            {!isInternetReachable && ' • Offline'}
          </Text>
        </View>
      </View>

      {/* Network Status */}
      {!isInternetReachable && (
        <View style={styles.offlineIndicator}>
          <FontAwesome6 name="wifi" size={14} color="#ffffff" iconStyle='solid' />
          <Text style={styles.offlineIndicatorText}>Mode Offline</Text>
        </View>
      )}

      {/* Cache Status */}
      {usingCache && (
        <View style={styles.cacheBanner}>
          <FontAwesome6 name="database" size={14} color="#ffffff" iconStyle='solid' />
          <Text style={styles.cacheBannerText}>Menggunakan data cache</Text>
          <TouchableOpacity onPress={handleClearCache} style={styles.clearCacheButton}>
            <Text style={styles.clearCacheText}>Clear</Text>
          </TouchableOpacity>
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
          placeholder={isInternetReachable ? `Search in ${category}...` : "Search (offline mode)"}
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
                ? 'Try adjusting your search'
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  offlineIndicator: {
    backgroundColor: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  offlineIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  cacheBanner: {
    backgroundColor: '#ff9800',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 5,
    margin: 16,
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
  productsList: {
    padding: 16,
    paddingTop: 0,
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
  wishlistButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: 11,
    color: '#888',
    lineHeight: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2e7d32',
    textAlign: 'center',
  },
  cacheIndicator: {
    fontSize: 14,
    color: '#ff9800',
    textAlign: 'center',
    marginTop: 8,
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
    color: '#d32f2f',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
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
});

export default ProductCategoryScreen;