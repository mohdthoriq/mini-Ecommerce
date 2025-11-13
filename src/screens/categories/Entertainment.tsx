import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Product } from '../../types';
import { productApi } from '../../services/api/productApi';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function Entertainment() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  
  const [entertainmentProducts, setEntertainmentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filter untuk kategori entertainment
  const entertainmentCategories = [
    'smartphones',
    'laptops',
    'fragrances',
    'skincare',
    'groceries',
    'home-decoration',
    'furniture',
    'tops',
    'womens-dresses',
    'womens-shoes',
    'mens-shirts',
    'mens-shoes',
    'mens-watches',
    'womens-watches',
    'womens-bags',
    'womens-jewellery',
    'sunglasses',
    'automotive',
    'motorcycle',
    'lighting'
  ];

  // Keywords untuk produk entertainment
  const entertainmentKeywords = [
    'game', 'music', 'movie', 'book', 'tv', 'audio', 'speaker', 
    'headphone', 'camera', 'gaming', 'entertainment', 'media',
    'video', 'streaming', 'console', 'playstation', 'xbox', 'nintendo'
  ];

  useEffect(() => {
    loadEntertainmentProducts();
  }, []);

  const loadEntertainmentProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎮 Loading entertainment products...');
      
      // Ambil semua produk dari API
      const allProducts = await productApi.getAllProducts();
      
      console.log('📦 Total products received:', allProducts.length);
      
      // Filter produk untuk kategori entertainment
      const filteredProducts = allProducts.filter(product => 
        isEntertainmentProduct(product)
      );
      
      console.log('🎯 Entertainment products found:', filteredProducts.length);
      
      setEntertainmentProducts(filteredProducts);
      
    } catch (err: any) {
      console.error('❌ Error loading entertainment products:', err);
      setError(err.message || 'Failed to load entertainment products');
      Alert.alert('Error', 'Failed to load entertainment products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isEntertainmentProduct = (product: Product): boolean => {
    const productName = product.name.toLowerCase();
    const productCategory = product.category.toLowerCase();
    const productDescription = product.description.toLowerCase();
    
    // Check jika termasuk dalam kategori entertainment
    const isEntertainmentCategory = 
      productCategory.includes('electronics') ||
      productCategory.includes('music') ||
      productCategory.includes('games') ||
      productCategory.includes('books') ||
      productCategory.includes('movies');
    
    // Check jika nama/deskripsi mengandung keyword entertainment
    const hasEntertainmentKeyword = entertainmentKeywords.some(keyword =>
      productName.includes(keyword) || productDescription.includes(keyword)
    );
    
    // Khusus untuk DummyJSON, kita akan consider beberapa kategori sebagai entertainment
    const isDummyJSONEntertainment = 
      productCategory.includes('smartphones') ||
      productCategory.includes('laptops') ||
      productCategory.includes('fragrances') || // Consider some as entertainment/lifestyle
      productCategory.includes('home-decoration') ||
      productCategory.includes('lighting');
    
    return isEntertainmentCategory || hasEntertainmentKeyword || isDummyJSONEntertainment;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEntertainmentProducts();
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Filter products berdasarkan search query
  const filteredProducts = entertainmentProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        {item.brand && (
          <Text style={styles.productBrand}>{item.brand}</Text>
        )}
        
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
          {item.discount && item.discount > 0 && (
            <Text style={styles.discountBadge}>{item.discount}% OFF</Text>
          )}
        </View>
        
        <View style={styles.productMeta}>
          <Text style={styles.productCategory}>{item.category}</Text>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        
        {item.stock !== undefined && (
          <Text style={[
            styles.stockText,
            item.stock < 10 ? styles.lowStock : styles.inStock
          ]}>
            {item.stock > 10 ? 'In Stock' : `Only ${item.stock} left`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading entertainment products...</Text>
      </View>
    );
  }

  if (error && entertainmentProducts.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome6 name="triangle-exclamation" size={50} color="#ef4444" iconStyle='solid' />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEntertainmentProducts}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🎮 Entertainment & Electronics</Text>
          <Text style={styles.subtitle}>
            {filteredProducts.length} products found
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#6b7280" iconStyle='solid'/>
        <TextInput
          style={styles.searchInput}
          placeholder="Search games, electronics, music..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome6 name="xmark" size={16} color="#6b7280" iconStyle='solid' />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="gamepad" size={60} color="#d1d5db" iconStyle='solid' />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No products found' : 'No entertainment products'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Check back later for new arrivals'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListHeaderComponent={
          filteredProducts.length > 0 ? (
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                Showing {filteredProducts.length} of {entertainmentProducts.length} products
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  resultsInfo: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inStock: {
    color: '#059669',
  },
  lowStock: {
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearSearchButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});