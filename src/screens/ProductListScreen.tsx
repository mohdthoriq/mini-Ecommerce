import React, { useState } from 'react';
import {
  View,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { initialProducts } from '../data/initialProducts';
import { Product } from '../types';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import AddProductButton from '../components/AddProductButton';
import ProductForm from '../components/ProductForm';
import { validationForm } from '../utils/validation';

const ProductListScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState({
    id: '',
    name: '',
    price: '',
    imageUrl: '',
    description: ''
  });

  interface FormErrors {
    name?: string;
    price?: string;
    imageUrl?: string;
  }
  const [errors, setErrors] = useState<FormErrors>({});

  const handleAddProduct = (): void => {
    setIsModalVisible(true);
  };

  const handleCloseModal = (): void => {
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
  };

  const handleInputChange = (field: keyof typeof newProduct, value: string): void => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check if the field is a valid key of FormErrors and if an error exists for it.
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = (): void => {
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
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard product={item} />
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Header />}
          ListFooterComponent={<AddProductButton onPress={handleAddProduct} />}
          contentContainerStyle={styles.listContent}
          numColumns={2} // Grid layout
          columnWrapperStyle={styles.columnWrapper}
        />

        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalContainer}>
            <ProductForm
              product={newProduct}
              errors={errors}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isSubmitting={isSubmitting}
            />
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfafaff', // Light background seperti marketplace
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default ProductListScreen;