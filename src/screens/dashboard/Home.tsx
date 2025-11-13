import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { AuthContext } from '../../context/AuthContext';
import { productApi } from '../../services/api/productApi';
import { Product } from '../../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const [isRefreshing, setRefreshing] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured products dari API
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setError(null);
      // Ambil produk populer dari API
      const popularProducts = await productApi.getPopularProducts(4);
      setFeaturedProducts(popularProducts);
    } catch (err) {
      setError('Failed to load featured products');
      console.error('Error fetching featured products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeaturedProducts().finally(() => {
      setRefreshing(false);
    });
  }, [fetchFeaturedProducts]);

  // Handle product press dengan kondisi login
  const handleProductPress = (product: Product) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to view product details',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }
    // Jika sudah login, navigasi ke detail product
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleExploreCategories = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to explore categories',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }
    navigation.dispatch(DrawerActions.jumpTo('CategoriesWithBottomTabs'));
  };

  const handleExploreAllProducts = () => {
    navigation.navigate('ProductList');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // Load featured products pertama kali
  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    if (isAuthenticated && navigation.canGoBack()) {
      navigation.navigate('Home');
    }
  }, [isAuthenticated, navigation]);

  // Component untuk loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2e7d32" />
      <Text style={styles.loadingText}>Loading featured products...</Text>
    </View>
  );

  // Component untuk error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={styles.errorTitle}>Failed to Load</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchFeaturedProducts}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#2e7d32']}
          tintColor="#2e7d32"
        />
      }
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>
          {isAuthenticated ? `Welcome, ${user?.name || 'User'}! 🌱` : 'Welcome to Eco Store! 🌱'}
        </Text>
        <Text style={styles.heroSubtitle}>
          Discover sustainable and eco-friendly products that care for our planet
        </Text>
        
        {!isAuthenticated ? (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>
              Please login to explore our full catalog and make purchases
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login to Get Started</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.welcomePrompt}>
            <Text style={styles.welcomeText}>
              Ready to explore eco-friendly products?
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton} 
              onPress={handleExploreCategories}
            >
              <Text style={styles.exploreButtonText}>Explore Products</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Featured Products Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Eco Products</Text>
          <Text style={styles.refreshHint}>↓ Pull down to refresh</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Handpicked sustainable products just for you
        </Text>

        <TouchableOpacity
          style={styles.categoriesButton}
          onPress={handleExploreAllProducts}
        >
          <Text style={styles.categoriesButtonText}>
            Lihat Semua Produk
          </Text>
        </TouchableOpacity>

        {/* Loading State */}
        {loading && !isRefreshing && renderLoading()}

        {/* Error State */}
        {error && !loading && renderError()}

        {/* Products Grid */}
        {!loading && !error && (
          <View style={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleProductPress(product)}
              >
                <Image 
                  source={{ uri: product.image }} 
                  style={styles.productImage} 
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
                  
                  {/* Badge Container */}
                  <View style={styles.badgeContainer}>
                    {product.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                    {product.discount && product.discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{product.discount}% OFF</Text>
                      </View>
                    )}
                  </View>

                  {!isAuthenticated && (
                    <Text style={styles.loginHint}>Login to view details</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && featuredProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Featured Products</Text>
            <Text style={styles.emptyText}>
              Check back later for featured eco products!
            </Text>
          </View>
        )}
      </View>

      {/* Categories Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore Categories</Text>
        <Text style={styles.sectionSubtitle}>
          Discover products by category
        </Text>

        <TouchableOpacity
          style={styles.categoriesButton}
          onPress={handleExploreCategories}
        >
          <Text style={styles.categoriesButtonText}>
            {isAuthenticated ? 'Browse All Categories' : 'Login to Browse Categories'}
          </Text>
        </TouchableOpacity>

        <View style={styles.categoriesGrid}>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryIcon}>📱</Text>
            <Text style={styles.categoryName}>Electronics</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryIcon}>👕</Text>
            <Text style={styles.categoryName}>Clothing</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryIcon}>🍎</Text>
            <Text style={styles.categoryName}>Food</Text>
          </View>
          <View style={styles.categoryItem}>
            <Text style={styles.categoryIcon}>🚗</Text>
            <Text style={styles.categoryName}>Automotive</Text>
          </View>
        </View>
      </View>

      {/* Benefits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Eco Store?</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🌍</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Eco-Friendly</Text>
              <Text style={styles.benefitDescription}>
                All products are sustainable and environmentally conscious
              </Text>
            </View>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💚</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Ethical Sourcing</Text>
              <Text style={styles.benefitDescription}>
                Products sourced from responsible and ethical suppliers
              </Text>
            </View>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🚚</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Fast Delivery</Text>
              <Text style={styles.benefitDescription}>
                Quick and carbon-neutral delivery options
              </Text>
            </View>
          </View>
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
  heroSection: {
    backgroundColor: '#2e7d32',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e8f5e9',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
    marginBottom: 20,
  },
  loginPrompt: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  welcomePrompt: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  loginText: {
    fontSize: 14,
    color: '#e8f5e9',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#e8f5e9',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  refreshHint: {
    fontSize: 12,
    color: '#4caf50',
    fontStyle: 'italic',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2e7d32',
  },
  // Error Styles
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 6,
  },
  // Badge Container
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loginHint: {
    fontSize: 10,
    color: '#ff9800',
    fontStyle: 'italic',
  },
  categoriesButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  categoriesButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    textAlign: 'center',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HomeScreen;