import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { productApi } from '../../services/api/productApi';
import { Product } from '../../types';
import WishlistButton from '../../routes/WishlistButton';

type DiscountScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const DiscountScreen = () => {
  const navigation = useNavigation<DiscountScreenNavigationProp>();

  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch discount products dari API
  const fetchDiscountProducts = async () => {
    try {
      setError(null);
      const allProducts = await productApi.getAllProducts();

      // Filter produk yang memiliki diskon
      // Asumsi: produk diskon memiliki property discount > 0
      const discountedProducts = allProducts.filter(product =>
        product.discount && product.discount > 0
      );

      setDiscountProducts(discountedProducts);
    } catch (err) {
      setError('Failed to load discount products');
      console.error('Error fetching discount products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data pertama kali
  useEffect(() => {
    fetchDiscountProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiscountProducts();
  }, []);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price * (1 - discount / 100);
  };

  // Komponen untuk product item dengan image error handling
  const ProductItem = ({ item }: { item: Product }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item.id)}
      >
        {imageError ? (
          <View style={[styles.productImage, styles.placeholderContainer]}>
            <Text style={styles.placeholderText}>🏷️</Text>
            <Text style={styles.placeholderSubtext}>Sale</Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}

        <View style={styles.wishlistButtonContainer}>
          <WishlistButton product={item} size={20} />
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>
              ${item.price.toLocaleString()}
            </Text>
            <Text style={styles.discountedPrice}>
              ${calculateDiscountedPrice(item.price, item.discount || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{item.discount}% OFF</Text>
          </View>

          <Text style={styles.productCategory}>{item.category}</Text>

          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading hot deals...</Text>
      </View>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDiscountProducts}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Hot Deals</Text>
      <Text style={styles.subtitle}>
        {discountProducts.length} limited time discounts available
      </Text>

      {discountProducts.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>No Discounts Available</Text>
          <Text style={styles.emptyText}>
            Check back later for special offers!
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDiscountProducts}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={discountProducts}
          renderItem={({ item }) => <ProductItem item={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2e7d32']}
              tintColor={'#2e7d32'}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#9bf89bff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    flexDirection: 'row',
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
    width: 100,
    height: 100,
    borderRadius: 8,
  },
   wishlistButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  placeholderContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 24,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#666',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff5722',
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2e7d32',
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
});

export default DiscountScreen;