// src/screens/PopularScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Product } from '../../types'; // ✅ Path yang benar
import { useDynamicHeader } from '../../hooks/useDynamicHeader';
import { productApi } from '../../services/api/productApi';
import WishlistButton from '../../routes/WishlistButton';

type PopularScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const PopularScreen = () => {
  const navigation = useNavigation<PopularScreenNavigationProp>();
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useDynamicHeader(
    navigation, 
    'Jelajahi Produk',
    'Product ter Populer!'
  );

  // Fetch popular products using productApi
  const fetchPopularProducts = async () => {
    try {
      setLoading(true);
      const products = await productApi.getPopularProducts(12);
      setPopularProducts(products);
    } catch (error: any) {
      console.error('Error in PopularScreen:', error);
      Alert.alert('Error', error.message || 'Failed to load popular products');
      // Fallback: fetch all products and show the first few
      try {
        console.log('Fallback: Fetching all products to display as popular.');
        const allProducts = await productApi.getAllProducts();
        // Take the first 12 products as a fallback for "popular"
        setPopularProducts(allProducts.slice(0, 12));
      } catch (fallbackError: any) {
        console.error('Fallback failed in PopularScreen:', fallbackError);
        Alert.alert(
          'Error', 
          fallbackError.message || 'Failed to load any products. Please check your connection.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPopularProducts();
  };

  useEffect(() => {
    fetchPopularProducts();
  }, []);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
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
      onPress={() => handleProductPress(item.id)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />

      <View style={styles.wishlistButtonContainer}>
        <WishlistButton product={item} size={20} />
      </View>

      <View style={styles.badgeContainer}>
        {item.isNew && (
          <View style={[styles.badge, styles.newBadge]}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}
        {item.discount && item.discount > 0 && (
          <View style={[styles.badge, styles.discountBadge]}>
            <Text style={styles.badgeText}>-{Math.round(item.discount)}% OFF</Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        
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

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading popular products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Popular Products</Text>
      <Text style={styles.subtitle}>Most loved by our customers</Text>
      
      <FlatList
        data={popularProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2e7d32']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No popular products found</Text>
            <Text style={styles.emptySubtext}>
              Check back later for trending items
            </Text>
          </View>
        }
      />
    </View>
  );
};

// Styles remain the same...
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
    backgroundColor: '#9bf89bff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2e7d32',
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
    position: 'relative',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  wishlistButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 6,
    alignItems: 'flex-start',
    zIndex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  newBadge: {
    backgroundColor: '#4caf50',
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
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  normalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  productDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  discountBadge: {
    backgroundColor: '#ff4444',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PopularScreen;