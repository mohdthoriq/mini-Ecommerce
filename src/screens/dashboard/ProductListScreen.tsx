import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initialProducts } from '../../data/initialProducts';
import { Product, NewProduct, ErrorsState } from '../../types';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import AddProductButton from '../../components/AddProductButton';
import ProductForm from '../../components/ProductForm';
import { validationForm } from '../../utils/validation';

const ProductListScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    id: '',
    name: '',
    price: '',
    imageUrl: '',
    description: ''
  });
  const [errors, setErrors] = useState<ErrorsState>({});

  // 🔥 HOOKS RESPONSIVE
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive layout calculations
  const isLandscape = width > height;
  const numColumns = isLandscape ? 3 : 2;
  const cardWidth = (width - (16 * 2) - (8 * (numColumns - 1))) / numColumns;

  const handleAddProduct = useCallback((): void => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setIsModalVisible(false);
    setNewProduct({
      id: '',
      name: '',
      price: '',
      imageUrl: '',
      description: ''
    });
    setErrors({});
    Keyboard.dismiss();
  }, []);

  const handleInputChange = useCallback((field: keyof NewProduct, value: string): void => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback((): void => {
    const validationErrors = validationForm(newProduct);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      const productToAdd: Product = {
        ...newProduct,
        id: Date.now().toString(),
        price: Number(newProduct.price),
      };
      
      setProducts(prev => [productToAdd, ...prev]);
      setIsSubmitting(false);
      handleCloseModal();
      
      Alert.alert(
        'Sukses!',
        'Produk berhasil ditambahkan',
        [{ text: 'OK', style: 'default' }]
      );
    }, 1000);
  }, [newProduct, handleCloseModal]);

  // 🔥 PERBAIKAN 1: Render ProductCard dengan props yang benar
  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard 
      product={item} 
      cardWidth={cardWidth}
      isLandscape={isLandscape}
    />
  ), [cardWidth, isLandscape]);

  const keyExtractor = useCallback((item: Product) => item.id, []);

  // 🔥 PERBAIKAN 2: Custom Header dengan tema hijau
  const renderHeader = useCallback(() => (
    <View style={[
      styles.headerContainer,
      { paddingHorizontal: isLandscape ? 20 : 16 }
    ]}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>🌱 Eco Products</Text>
        <Text style={styles.headerSubtitle}>Sustainable & Green Items</Text>
      </View>
      
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {products.filter(p => p.price < 50).length}
          </Text>
          <Text style={styles.statLabel}>Affordable</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {products.filter(p => p.price >= 50).length}
          </Text>
          <Text style={styles.statLabel}>Premium</Text>
        </View>
      </View>
    </View>
  ), [products.length, isLandscape]);

  // 🔥 PERBAIKAN 3: Custom Footer dengan tema hijau
  const renderFooter = useCallback(() => (
    <View style={styles.footerContainer}>
      <AddProductButton 
        onPress={handleAddProduct}
        isLandscape={isLandscape}
      />
      <Text style={styles.footerText}>
        Making sustainable shopping accessible 🌍
      </Text>
    </View>
  ), [isLandscape, handleAddProduct]);

  // 🔥 PERBAIKAN 4: Empty State
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyTitle}>No Products Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding eco-friendly products to your catalog
      </Text>
    </View>
  ), []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[
        styles.container,
        { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }
      ]}>
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={products.length > 0 ? renderFooter : null}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={[
            styles.listContent,
            products.length === 0 && styles.emptyListContent
          ]}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          key={numColumns}
        />

        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle={isLandscape ? "formSheet" : "pageSheet"}
          onRequestClose={handleCloseModal}
        >
          <ProductForm
            product={newProduct}
            errors={errors}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isSubmitting={isSubmitting}
            screenHeight={height}
            insets={insets}
          />
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerContainer: {
    backgroundColor: '#f0f7f0',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8d4',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4caf50',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    minWidth: 80,
    shadowColor: '#2e7d32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 11,
    color: '#4caf50',
    marginTop: 4,
    textAlign: 'center',
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#d4e8d4',
  },
  footerText: {
    fontSize: 14,
    color: '#4caf50',
    opacity: 0.7,
    marginTop: 15,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#4caf50',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
});

export default ProductListScreen;