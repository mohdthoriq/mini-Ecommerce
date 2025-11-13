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

export default function Baby() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  
  const [babyProducts, setBabyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Kategori dan keywords untuk produk bayi & anak
  const babyCategories = [
    'all',
    'baby-care',
    'toys',
    'kids-fashion',
    'nursery',
    'feeding'
  ];

  const babyKeywords = [
    'baby', 'kids', 'toy', 'diaper', 'stroller', 'crib', 'pacifier',
    'bottle', 'feeding', 'nursery', 'child', 'infant', 'toddler',
    'play', 'educational', 'safety', 'care', 'bath', 'clothing',
    'onesie', 'bib', 'rattle', 'teether', 'walker', 'car seat'
  ];

  // Kategorisasi produk bayi berdasarkan konten
  const getProductCategory = (product: Product): string => {
    const name = product.name.toLowerCase();
    const desc = product.description.toLowerCase();
    
    if (name.includes('toy') || desc.includes('toy') || name.includes('play')) {
      return 'toys';
    } else if (name.includes('cream') || desc.includes('care') || name.includes('lotion')) {
      return 'baby-care';
    } else if (name.includes('clothing') || desc.includes('wear') || name.includes('onesie')) {
      return 'kids-fashion';
    } else if (name.includes('crib') || desc.includes('nursery') || name.includes('stroller')) {
      return 'nursery';
    } else if (name.includes('bottle') || desc.includes('feeding') || name.includes('food')) {
      return 'feeding';
    }
    
    return 'baby-care';
  };

  useEffect(() => {
    loadBabyProducts();
  }, []);

  const loadBabyProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👶 Loading baby products...');
      
      // Ambil semua produk dari API
      const allProducts = await productApi.getAllProducts();
      
      console.log('📦 Total products received:', allProducts.length);
      
      // Filter produk untuk kategori bayi & anak
      const filteredProducts = allProducts.filter(product => 
        isBabyProduct(product)
      );
      
      console.log('🧸 Baby products found:', filteredProducts.length);
      
      setBabyProducts(filteredProducts);
      
    } catch (err: any) {
      console.error('❌ Error loading baby products:', err);
      setError(err.message || 'Failed to load baby products');
      Alert.alert('Error', 'Failed to load baby products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isBabyProduct = (product: Product): boolean => {
    const productName = product.name.toLowerCase();
    const productCategory = product.category.toLowerCase();
    const productDescription = product.description.toLowerCase();
    
    // Check jika nama/deskripsi mengandung keyword bayi & anak
    const hasBabyKeyword = babyKeywords.some(keyword =>
      productName.includes(keyword) || productDescription.includes(keyword)
    );
    
    // Untuk DummyJSON, kita akan consider beberapa kategori sebagai produk bayi
    // berdasarkan kesesuaian dengan kebutuhan bayi & anak
    const isSuitableForBaby = 
      productCategory.includes('skincare') && (
        productName.includes('baby') || productDescription.includes('baby')
      ) ||
      productCategory.includes('home-decoration') && (
        productName.includes('nursery') || productDescription.includes('baby')
      ) ||
      productCategory.includes('groceries') && (
        productName.includes('baby') || productDescription.includes('infant')
      );
    
    return hasBabyKeyword || isSuitableForBaby;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBabyProducts();
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
  const filteredProducts = babyProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      getProductCategory(product) === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'all': 'All',
      'baby-care': 'Baby Care',
      'toys': 'Toys & Play',
      'kids-fashion': "Kids' Fashion",
      'nursery': 'Nursery',
      'feeding': 'Feeding'
    };
    
    return categoryMap[category] || category;
  };

  // Gunakan icon yang benar-benar valid dari FontAwesome6
  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'all': 'th-large', // Grid icon
      'baby-care': 'heart', // Heart icon
      'toys': 'gamepad', // Gamepad icon
      'kids-fashion': 'shirt', // T-shirt icon
      'nursery': 'home', // Home icon
      'feeding': 'wine-bottle' // Bottle icon
    };
    
    return (iconMap[category] || 'circle') as any;
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
          <View style={styles.categoryTag}>
            <FontAwesome6 
              name={getCategoryIcon(getProductCategory(item))} 
              size={10} 
              color="#6b7280" 
            />
            <Text style={styles.productCategory}>
              {getCategoryDisplayName(getProductCategory(item))}
            </Text>
          </View>
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
        
        {/* Safety badge untuk produk bayi */}
        {(item.name.toLowerCase().includes('baby') || item.description.toLowerCase().includes('baby')) && (
          <View style={styles.safetyBadge}>            
            <FontAwesome6 name="shield" size={10} color="#059669" iconStyle='solid' />
            <Text style={styles.safetyText}>Baby Safe</Text>          
          </View>
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
      <FontAwesome6 
        name={getCategoryIcon(item)} 
        size={14} 
        color={selectedCategory === item ? '#ffffff' : '#6b7280'} 
      />
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
        <ActivityIndicator size="large" color="#f472b6" />
        <Text style={styles.loadingText}>Loading baby products...</Text>
      </View>
    );
  }

  if (error && babyProducts.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome6 name="child" size={50} color="#ef4444" iconStyle='solid' />
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadBabyProducts}>
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
          <Text style={styles.title}>👶 Baby & Kids</Text>
          <Text style={styles.subtitle}>
            Everything for your little one's needs
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search toys, care products, nursery..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        <FlatList
          data={babyCategories}
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
            <Text style={styles.emptyIcon}>👶</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'No products found' 
                : 'No baby products available'
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
                Showing {filteredProducts.length} of {babyProducts.length} products
                {selectedCategory !== 'all' && ` in ${getCategoryDisplayName(selectedCategory)}`}
              </Text>
              <View style={styles.safetyNotice}>
                <Text style={styles.safetyIcon}>🛡️</Text>
                <Text style={styles.safetyNoticeText}>
                  All products are carefully selected for baby safety
                </Text>
              </View>
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
    backgroundColor: '#f472b6',
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
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  searchIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearIcon: {
    fontSize: 16,
    color: '#6b7280',
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
    color: '#e8ecf7ff',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 8,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  safetyIcon: {
    fontSize: 14,
  },
  safetyNoticeText: {
    fontSize: 12,
    color: '#059669',
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
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#f472b6',
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
    marginBottom: 4,
  },
  inStock: {
    color: '#059669',
  },
  lowStock: {
    color: '#ef4444',
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  safetyText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
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