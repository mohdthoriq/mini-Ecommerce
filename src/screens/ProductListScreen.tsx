import React, { useState } from 'react';
import { initialProducts } from '../data/initialProducts';
import { FormErrors, NewProduct, Product } from '../types';
import { Alert, FlatList, Keyboard, Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { validationForm } from '../utils/validation';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import AddProductButton from '../components/AddProductButton';
import ProductForm from '../components/ProductForm';

const ProductListScreen: React.FC = () => {
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [newProduct, setNewProduct] = useState<NewProduct>({
        id: '',
        name: '',
        price: '',
        imageUrl: '',
        description: ''
    })
    const [errors, setErrors] = useState<FormErrors>({})

    const handleAddProduct = () => {
        setIsModalVisible(true)
    }

    const handleCloseModal = () => {
        setIsModalVisible(false)
        setNewProduct({
            id: '',
            name: '',
            price: '',
            imageUrl: '',
            description: ''
        })
        setErrors({})
        Keyboard.dismiss()
    }

    const handleInputChange = (field: keyof NewProduct, value: string): void => {
        setNewProduct(prev => ({
            ...prev,
            [field]: value
        }))

        const errorField = field as keyof FormErrors;
        if (errors[errorField]) {
            setErrors(prev => ({
                ...prev,
                [errorField]: ''
            }))
        }
    }

    const handleSubmit = () => {
        const validationErrors = validationForm(newProduct)

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }

        setIsSubmitting(true)

        setTimeout(() => {
            const productToAdd: Product = {
                ...newProduct,
                id: Date.now().toString(),
                price: Number(newProduct.price)
            }

            setProducts(prev => [productToAdd, ...prev])
            setIsSubmitting(false)
            handleCloseModal()

            Alert.alert(
                'Sukses',
                'Produk berhasil ditambahkan',
                [{ text: 'OK' }]
            );
        }, 1000)
    }

    const renderProductItem = ({ item }: { item: Product }) => (
        <ProductCard product={item}/>
    ) 

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                    <FlatList
                        data={products}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        numColumns={2}
                        ListHeaderComponent={<Header/>}
                        ListFooterComponent={<AddProductButton onPress={handleAddProduct}/>}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                    />

                    <Modal
                        visible={isModalVisible}
                        animationType='slide'
                        presentationStyle='pageSheet'
                        onRequestClose={handleCloseModal}
                    >
                        <View style={styles.modalContainer}>
                            <ProductForm 
                                product={newProduct}
                                errors={errors}
                                onChange={handleInputChange}
                                onCancel={handleCloseModal}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                            />
                        </View>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        </>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default ProductListScreen;