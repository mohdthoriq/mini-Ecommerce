import React, { useState, useEffect, useCallback } from 'react';
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

type ElectronicsScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const ElectronicsScreen = () => {
  const navigation = useNavigation<ElectronicsScreenNavigationProp>();

  const [electronicsProducts, setElectronicsProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search terms untuk produk elektronik
  const electronicsSearchTerms = [
    'phone', 'smartphone', 'laptop', 'tablet', 'computer',
    'camera', 'headphone', 'earphone', 'watch', 'tv',
    'monitor', 'macbook', 'iphone', 'samsung', 'android',
    'electronic', 'tech', 'gadget', 'wireless', 'bluetooth'
  ];

  // Fetch electronics products menggunakan search
  const fetchElectronicsProducts = async () => {
    try {
      setError(null);
      let allElectronics: Product[] = [];

      // Search untuk setiap term elektronik
      for (const term of electronicsSearchTerms) {
        try {
          const searchResults = await productApi.searchProducts(term);
          allElectronics = [...allElectronics, ...searchResults];
        } catch (searchError) {
          console.log(`Search failed for term: ${term}`);
        }
      }

      // Hapus duplikat berdasarkan product ID
      const uniqueProducts = allElectronics.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      console.log(`Found ${uniqueProducts.length} unique electronics products`);
      setElectronicsProducts(uniqueProducts);

    } catch (err) {
      console.error('Error in fetchElectronicsProducts:', err);
      
      // Fallback: coba ambil semua produk dan filter
      try {
        console.log('Trying fallback method...');
        const allProducts = await productApi.getAllProducts();
        const filteredProducts = allProducts.filter(product => {
          const category = product.category?.toLowerCase() || '';
          const name = product.name?.toLowerCase() || '';
          const description = product.description?.toLowerCase() || '';

          return (
            category.includes('laptop') ||
            category.includes('smartphone') ||
            category.includes('mobile') ||
            category.includes('electronic') ||
            category.includes('computer') ||
            category.includes('tech') ||
            name.includes('iphone') ||
            name.includes('samsung') ||
            name.includes('macbook') ||
            name.includes('laptop') ||
            name.includes('smartphone') ||
            name.includes('tablet') ||
            name.includes('camera') ||
            name.includes('headphone') ||
            name.includes('earphone') ||
            name.includes('watch') ||
            name.includes('tv') ||
            name.includes('monitor') ||
            description.includes('electronic') ||
            description.includes('tech') ||
            description.includes('digital')
          );
        });
        
        setElectronicsProducts(filteredProducts);
        console.log(`Fallback found ${filteredProducts.length} products`);
      } catch (fallbackError) {
        setError('Failed to load electronics products');
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Optimized version dengan Promise.all
  const fetchElectronicsProductsOptimized = async () => {
    try {
      setError(null);

      // Gunakan Promise.all untuk search paralel
      const searchPromises = electronicsSearchTerms.map(term =>
        productApi.searchProducts(term).catch(err => {
          console.log(`Search failed for term: ${term}`);
          return []; // Return empty array jika search gagal
        })
      );

      const searchResults = await Promise.all(searchPromises);
      const allElectronics = searchResults.flat();

      // Hapus duplikat
      const uniqueProducts = allElectronics.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      console.log(`Found ${uniqueProducts.length} unique electronics products`);
      setElectronicsProducts(uniqueProducts);

    } catch (err) {
      console.error('Error in optimized fetch:', err);
      // Fallback ke method sebelumnya
      await fetchElectronicsProducts();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data pertama kali
  useEffect(() => {
    fetchElectronicsProductsOptimized();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchElectronicsProductsOptimized();
  }, []);

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  // Hitung harga diskon
  const calculateDiscountedPrice = (price: number, discount?: number) => {
    if (!discount) return price;
    return Math.round(price * (1 - discount / 100));
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
            <Text style={styles.placeholderText}>📱</Text>
            <Text style={styles.placeholderSubtext}>Tech</Text>
          </View>
        ) : (
          <Image 
            source={{ uri: item.image }} 
            style={styles.productImage} 
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          
          {/* Harga dengan diskon */}
          {item.discount && item.discount > 0 ? (
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>
                ${item.price.toLocaleString()}
              </Text>
              <Text style={styles.discountedPrice}>
                ${calculateDiscountedPrice(item.price, item.discount).toLocaleString()}
              </Text>
            </View>
          ) : (
            <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
          )}
          
          <Text style={styles.productCategory}>{item.category}</Text>
          
          <View style={styles.badgeContainer}>
            {/* Badge untuk produk baru */}
            {item.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            
            {/* Badge untuk produk diskon */}
            {item.discount && item.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{Math.round(item.discount)}% OFF</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading electronics products...</Text>
        <Text style={styles.loadingSubtext}>Searching for phones, laptops, and gadgets</Text>
      </View>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>📱</Text>
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchElectronicsProductsOptimized}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 Electronics</Text>
      <Text style={styles.subtitle}>
        {electronicsProducts.length > 0 
          ? `${electronicsProducts.length} smart gadgets available`
          : 'Searching for electronics products...'
        }
      </Text>
      
      <FlatList
        data={electronicsProducts}
        renderItem={({ item }) => <ProductItem item={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          electronicsProducts.length === 0 && styles.emptyListContent
        ]}
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
              <Text style={styles.emptyIcon}>🔌</Text>
              <Text style={styles.emptyTitle}>No Electronics Found</Text>
              <Text style={styles.emptyText}>
                We searched for phones, laptops, tablets, and other gadgets but couldn't find any electronics products.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchElectronicsProductsOptimized}>
                <Text style={styles.retryButtonText}>Search Again</Text>
              </TouchableOpacity>
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
  emptyListContent: {
    flexGrow: 1,
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
  placeholderContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 20,
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 10,
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
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  productCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  newBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountBadgeText: {
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
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ElectronicsScreen;