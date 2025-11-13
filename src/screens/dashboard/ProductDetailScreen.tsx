import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { productApi } from '../../services/api/productApi';
import ResetStackButton from '../../components/ResetStackButton';

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;

const ProductDetailScreen = () => {
  const { addToCart } = useCart();
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute();
  const { productId } = route.params as { productId: string };

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching product details for ID:', productId);
      
      const productData = await productApi.getProductById(productId);
      setProduct(productData);
      
      console.log('✅ Product details loaded:', productData);
    } catch (err: any) {
      console.error('❌ Error fetching product:', err);
      setError(err.message || 'Failed to load product details');
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDrawerHome = () => {
      navigation.navigate('Home');
  };

  const handleAddToCart = () => {
    if (!product) return; // Guard clause
    addToCart(product);
    // Menampilkan notifikasi sederhana bahwa produk telah ditambahkan
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  const handleBuyNow = () => {
    if (!product) return; // Guard clause
    addToCart(product, 1); // Cukup tambahkan ke keranjang
    // Tidak ada navigasi atau alert yang kompleks
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load product</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProductDetail}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image || product.thumbnail }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.badgeContainer}>
          {product.isNew && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {product.discount && product.discount > 0 && (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>{Math.round(product.discount)}% OFF</Text>
            </View>
          )}
          {product.stock != null && product.stock < 10 && (
            <View style={[styles.badge, styles.lowStockBadge]}>
              <Text style={styles.badgeText}>LOW STOCK</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{product.category?.toUpperCase() || 'PRODUCT'}</Text>
        <Text style={styles.name}>{product.name}</Text>
        
        {/* Brand dan Rating */}
        <View style={styles.metaInfo}>
          {product.brand && (
            <Text style={styles.brand}>Brand: {product.brand}</Text>
          )}
          {product.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {product.rating}/5</Text>
            </View>
          )}
        </View>

        <Text style={styles.price}>${product.price?.toLocaleString()}</Text>
        
        {/* Stock Information */}
        <View style={styles.stockContainer}>
          <Text style={[
            styles.stockText, 
            (product.stock ?? 0) > 10 ? styles.inStock : styles.lowStock
          ]}>
            {(product.stock ?? 0) > 10 ? 'In Stock' : `Only ${product.stock ?? 0} left`}
          </Text>
        </View>

        <Text style={styles.description}>{product.description}</Text>

        {/* Product Features dari data API */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Product Details:</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>•</Text>
            <Text style={styles.featureText}>
              <Text style={styles.featureLabel}>Category: </Text>
              {product.category}
            </Text>
          </View>
          
          {product.brand && (
            <View style={styles.featureItem}>
              <Text style={styles.featureDot}>•</Text>
              <Text style={styles.featureText}>
                <Text style={styles.featureLabel}>Brand: </Text>
                {product.brand}
              </Text>
            </View>
          )}
          
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>•</Text>
            <Text style={styles.featureText}>
              <Text style={styles.featureLabel}>Rating: </Text>
              {product.rating} / 5
            </Text>
          </View>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>•</Text>
            <Text style={styles.featureText}>
              <Text style={styles.featureLabel}>Stock: </Text>
              {product.stock} units available
            </Text>
          </View>
          
          {product.discount && product.discount > 0 && (
            <View style={styles.featureItem}>
              <Text style={styles.featureDot}>•</Text>
              <Text style={styles.featureText}>
                <Text style={styles.featureLabel}>Discount: </Text>
                {Math.round(product.discount)}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[
              styles.cartButton,
              (product.stock ?? 0) === 0 && styles.disabledButton
            ]} 
            onPress={handleAddToCart}
            disabled={(product.stock ?? 0) === 0}
          >
            <Text style={styles.cartButtonText}>
              {(product.stock ?? 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.buyButton,
              (product.stock ?? 0) === 0 && styles.disabledButton
            ]} 
            onPress={handleBuyNow}
            disabled={(product.stock ?? 0) === 0}
          >
            <Text style={styles.buyButtonText}>
              {(product.stock ?? 0) === 0 ? 'Out of Stock' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={handleBackToDrawerHome}
                      >
            <Text style={styles.navButtonText}>Back to Drawer Home</Text>
          </TouchableOpacity>
          
          <ResetStackButton />
          
          <TouchableOpacity 
            style={styles.navButtonSecondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.navButtonSecondaryText}>Back to Products</Text>
          </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5722',
    marginBottom: 16,
    textAlign: 'center',
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
    fontWeight: '600',
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
  lowStockBadge: {
    backgroundColor: '#ff9800',
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
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brand: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '500',
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
  lowStock: {
    color: '#ff5722',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
  },
  features: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureDot: {
    color: '#4caf50',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  featureLabel: {
    fontWeight: '600',
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
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
  navButtonSecondary: {
    backgroundColor: '#d8f7dbff',
    borderWidth: 1,
    borderColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;