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
import WishlistButton from '../../routes/WishlistButton';

export default function Clothing() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  
  const [clothingProducts, setClothingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Kategori fashion dari DummyJSON
  const fashionCategories = [
    'all',
    'tops',
    'womens-dresses',
    'womens-shoes',
    'mens-shirts',
    'mens-shoes',
    'mens-watches',
    'womens-watches',
    'womens-bags',
    'womens-jewellery',
    'sunglasses'
  ];

  // Keywords untuk produk fashion
  const fashionKeywords = [
    'shirt', 'dress', 'jeans', 'jacket', 'pants', 'skirt', 'top',
    'shoes', 'bag', 'jewelry', 'watch', 'sunglasses', 'accessory',
    'fashion', 'clothing', 'apparel', 'wear', 'outfit'
  ];

  useEffect(() => {
    loadClothingProducts();
  }, []);

  const loadClothingProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👕 Loading clothing products...');
      
      // Ambil semua produk dari API
      const allProducts = await productApi.getAllProducts();
      
      console.log('📦 Total products received:', allProducts.length);
      
      // Filter produk untuk kategori fashion/clothing
      const filteredProducts = allProducts.filter(product => 
        isFashionProduct(product)
      );
      
      console.log('👚 Clothing products found:', filteredProducts.length);
      
      setClothingProducts(filteredProducts);
      
    } catch (err: any) {
      console.error('❌ Error loading clothing products:', err);
      setError(err.message || 'Failed to load clothing products');
      Alert.alert('Error', 'Failed to load clothing products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isFashionProduct = (product: Product): boolean => {
    const productName = product.name.toLowerCase();
    const productCategory = product.category.toLowerCase();
    const productDescription = product.description.toLowerCase();
    
    // Check jika termasuk dalam kategori fashion DummyJSON
    const isFashionCategory = fashionCategories.some(category => 
      productCategory.includes(category) && category !== 'all'
    );
    
    // Check jika nama/deskripsi mengandung keyword fashion
    const hasFashionKeyword = fashionKeywords.some(keyword =>
      productName.includes(keyword) || productDescription.includes(keyword)
    );
    
    return isFashionCategory || hasFashionKeyword;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClothingProducts();
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
  };

  // Filter products berdasarkan search query dan kategori
  const filteredProducts = clothingProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      product.category.toLowerCase().includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'all': 'All',
      'tops': 'Tops',
      'womens-dresses': 'Dresses',
      'womens-shoes': "Women's Shoes",
      'mens-shirts': "Men's Shirts",
      'mens-shoes': "Men's Shoes",
      'mens-watches': "Men's Watches",
      'womens-watches': "Women's Watches",
      'womens-bags': "Women's Bags",
      'womens-jewellery': 'Jewelry',
      'sunglasses': 'Sunglasses'
    };
    
    return categoryMap[category] || category;
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
        
        {item.brand && (
          <Text style={styles.productBrand}>{item.brand}</Text>
        )}
        
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
          {item.discount && item.discount > 0 && (
            <Text style={styles.discountBadge}>{Math.round(item.discount)}% OFF</Text>
          )}
        </View>
        
        <View style={styles.productMeta}>
          <Text style={styles.productCategory}>
            {getCategoryDisplayName(item.category)}
          </Text>
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

  const renderCategoryChip = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item && styles.categoryChipSelected
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === item && styles.categoryChipTextSelected
      ]}>
        {getCategoryDisplayName(item)}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading fashion collection...</Text>
      </View>
    );
  }

  if (error && clothingProducts.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome6 name="shirt" size={50} color="#ef4444" iconStyle='solid' />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadClothingProducts}>
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
          <Text style={styles.title}>👕 Fashion & Clothing</Text>
          <Text style={styles.subtitle}>
            Discover the latest trends and styles
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome6 name="magnifying-glass" size={16} color="#6b7280" iconStyle='solid' />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dresses, shirts, shoes..."
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

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        <FlatList
          data={fashionCategories}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
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
            <FontAwesome6 name="shirt" size={60} color="#d1d5db" iconStyle='solid' />
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'No products found' 
                : 'No clothing products available'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : selectedCategory !== 'all'
                ? `No products in ${getCategoryDisplayName(selectedCategory)} category`
                : 'Check back later for new arrivals'
              }
            </Text>
            {(searchQuery || selectedCategory !== 'all') && (
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                <Text style={styles.clearFilterText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListHeaderComponent={
          filteredProducts.length > 0 ? (
            <View style={styles.resultsInfo}>
              <Text style={styles.resultsText}>
                Showing {filteredProducts.length} of {clothingProducts.length} products
                {selectedCategory !== 'all' && ` in ${getCategoryDisplayName(selectedCategory)}`}
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
    backgroundColor: '#9bf89bff',
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
    marginBottom: 8,
    padding: 12,
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
  categoriesSection: {
    backgroundColor: '#32a538ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f6f8ff',
    marginBottom: 12,
  },
  categoriesList: {
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
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
  wishlistButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
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
  clearFilterButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});