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

// Fallback product data untuk error 404/500
const FALLBACK_PRODUCT: Product = {
  id: "fallback",
  name: "Produk Arsip",
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

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowFallback(false);
      setHttpStatus(null);
      
      console.log('🔄 Fetching product details for ID:', productId);
      
      const productData = await productApi.getProductById(productId);
      setProduct(productData);
      
      console.log('✅ Product details loaded:', productData);
    } catch (err: any) {
      console.error('❌ Error fetching product:', err);
      
      // Deteksi status code error
      const status = err.response?.status;
      setHttpStatus(status);
      
      if (status === 404) {
        console.warn('⚠️ Product not found (404) - Showing fallback data');
      } else if (status === 500) {
        console.error('💥 Server error (500) - Showing fallback data');
      } else {
        console.error('🚨 Other error:', err.message);
      }
      
      setError(err.message || 'Failed to load product details');
      
      // Show fallback product untuk 404 atau 500 errors
      if (status === 404 || status === 500) {
        setShowFallback(true);
        setProduct(FALLBACK_PRODUCT);
        
        // Show toast message
        Alert.alert(
          'Info', 
          'Gagal memuat data terbaru. Menampilkan versi arsip.',
          [{ text: 'OK' }]
        );
      } else {
        // Untuk error lain, show alert biasa
        Alert.alert('Error', 'Failed to load product details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDrawerHome = () => {
    navigation.navigate('Home');
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Prevent adding fallback product to cart
    if (product.id === "fallback") {
      Alert.alert('Info', 'Produk arsip tidak dapat ditambahkan ke keranjang.');
      return;
    }
    
    addToCart(product);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    // Prevent buying fallback product
    if (product.id === "fallback") {
      Alert.alert('Info', 'Produk arsip tidak dapat dibeli.');
      return;
    }
    
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  // Use fallback product if available, otherwise show error
  const displayProduct = showFallback ? product : product;
  
  if ((error && !showFallback) || !displayProduct) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load product</Text>
        <Text style={styles.errorSubText}>
          {httpStatus ? `HTTP ${httpStatus}` : error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProductDetail}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Fallback Product Banner */}
      {showFallback && (
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackBannerText}>
            ⚠️ Menampilkan Versi Arsip
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
          source={{ uri: displayProduct.image || displayProduct.thumbnail }}
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
              <Text style={styles.badgeText}>ARSIP</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{displayProduct.category?.toUpperCase() || 'PRODUCT'}</Text>
        <Text style={styles.name}>{displayProduct.name}</Text>
        
        <Text style={styles.price}>
          {displayProduct.price > 0 ? `$${displayProduct.price.toLocaleString()}` : 'Harga tidak tersedia'}
        </Text>
        
        <View style={styles.stockContainer}>
          <Text style={[
            styles.stockText, 
            (displayProduct.stock ?? 0) > 0 ? styles.inStock : styles.outOfStock
          ]}>
            {(displayProduct.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>
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
              {showFallback ? 'Produk Arsip' : 
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
              {showFallback ? 'Tidak Tersedia' : 
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
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
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
  debugText: {
    fontSize: 12,
    color: '#1976d2',
    fontFamily: 'monospace',
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
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
});

export default ProductDetailScreen;