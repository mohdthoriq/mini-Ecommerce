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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initialProducts } from '../data/initialProducts';
import { Product, NewProduct, ErrorsState } from '../types';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import AddProductButton from '../components/AddProductButton';
import ProductForm from '../components/ProductForm';
import { validationForm } from '../utils/validation';

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
        [{ text: 'OK' }]
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

  // 🔥 PERBAIKAN 2: Render Header dengan props yang benar
 const renderHeader: React.FC = useCallback(() => (
    <Header 
      isLandscape={isLandscape}
      screenWidth={width}
    />
  ), [isLandscape, width]);

  const renderFooter: React.FC = useCallback(() => (
    <AddProductButton 
      onPress={handleAddProduct}
      isLandscape={isLandscape}
    />
  ), [isLandscape, handleAddProduct]);


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
          ListHeaderComponent={renderHeader} // 🔥 Gunakan function yang sudah diperbaiki
          ListFooterComponent={renderFooter} // 🔥 Gunakan function yang sudah diperbaiki
          contentContainerStyle={styles.listContent}
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
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});

export default ProductListScreen;