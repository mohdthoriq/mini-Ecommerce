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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { initialProducts } from '../../data/initialProducts';
import { AuthContext } from '../../context/AuthContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const [isRefreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState(initialProducts.slice(0, 4));

  const sampleProducts = products;

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Simulate API call or data refresh
    setTimeout(() => {
      // Shuffle products to show refresh effect
      const shuffled = [...initialProducts]
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);
      setProducts(shuffled);
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleProductPress = (productId: string) => {
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
    navigation.navigate('ProductDetail', { productId });
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
    navigation.navigate('CategoriesWithBottomTabs'); // Arahkan ke tab 'Categories'
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  useEffect(() => {
    if (isAuthenticated && navigation.canGoBack()) {
      // Jika sudah login dan ada history, pastikan kita di home
      navigation.navigate('Home');
    }
  }, [isAuthenticated, navigation]);


  useEffect(() => {
    if (isAuthenticated && navigation.canGoBack()) {
      navigation.navigate('Home');
    }
  }, [isAuthenticated, navigation]);


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
          title="Pull to refresh..."
          titleColor="#2e7d32"
        />
      }
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>
          {isAuthenticated ? `Welcome back, ${user?.name}! 🌱` : 'Welcome to Eco Store! 🌱'}
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
              onPress={() => navigation.navigate('CategoriesWithBottomTabs')}
            >
              <Text style={styles.exploreButtonText}>Explore Products</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sample Products Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Eco Products</Text>
          <Text style={styles.refreshHint}>↓ Pull down to refresh</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Here are some samples of our sustainable products
        </Text>

        <View style={styles.productsGrid}>
          {sampleProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => handleProductPress(product.id)}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
                {!isAuthenticated && (
                  <Text style={styles.loginHint}>Login to view details</Text>
                )}
              </View>
              {product.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: '#f8f9fa',
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
    marginBottom: 4,
  },
  loginHint: {
    fontSize: 10,
    color: '#ff9800',
    fontStyle: 'italic',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
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