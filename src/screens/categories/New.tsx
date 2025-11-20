import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { productApi } from '../../services/api/productApi';
import { Product } from '../../types';
import WishlistButton from '../../routes/WishlistButton';

type NewScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const NewScreen = () => {
  const navigation = useNavigation<NewScreenNavigationProp>();
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data produk baru
  const fetchNewProducts = async () => {
    try {
      setError(null);
      let products: Product[];
      
      // Coba ambil dari endpoint khusus produk baru
      try {
        products = await productApi.getNewProducts();
      } catch (apiError) {
        // Jika endpoint khusus tidak ada, ambil semua dan filter
        console.log('Using fallback method for new products');
        const allProducts = await productApi.getAllProducts();
        products = allProducts.filter(product => product.isNew);
      }
      
      setNewProducts(products);
    } catch (err) {
      setError('Failed to load new products');
      console.error('Error fetching new products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data pertama kali
  useEffect(() => {
    fetchNewProducts();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNewProducts();
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.productImage} 
        resizeMode="cover" 
      />

      <View style={styles.wishlistButtonContainer}>
        <WishlistButton product={item} size={20} />
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        {item.rating && (
          <Text style={styles.productRating}>⭐ {item.rating}</Text>
        )}
      </View>
      <View style={styles.badgeContainer}>
        <View style={[styles.badge, styles.newBadge]}>
          <Text style={styles.badgeText}>NEW</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading new arrivals...</Text>
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchNewProducts}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🆕 New Arrivals</Text>
      <Text style={styles.subtitle}>Fresh products just for you</Text>
      
      <FlatList
        data={newProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2e7d32']}
            tintColor={'#2e7d32'}
          />
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No New Products</Text>
              <Text style={styles.emptyText}>
                Check back later for new arrivals!
              </Text>
            </View>
          ) : null
        }
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
    elevation: 2,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
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
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  productRating: {
    fontSize: 12,
    color: '#666',
  },
  newBadge: {
    backgroundColor: '#4caf50',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
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

export default NewScreen;