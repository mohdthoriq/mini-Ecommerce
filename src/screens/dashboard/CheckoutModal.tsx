import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // ✅ PERBAIKI IMPORT
import { HomeStackParamList } from '../../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type ModalCheckoutNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CheckoutModal'>;

const CheckoutModalScreen = () => {
    const navigation = useNavigation<ModalCheckoutNavigationProp>();
    const route = useRoute();

    type ShippingMethod = 'regular' | 'express' | 'container';

    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('regular');
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('credit_card');

    // State untuk form data
    const [formData, setFormData] = useState({
        fullName: '',
        streetAddress: '',
        city: '',
        postalCode: '',
        phoneNumber: '',
    });

    // Dapatkan product dari params atau gunakan default
    const { product } = route.params as { product: any };

    const getShippingFee = (): number => {
        const fees: Record<ShippingMethod, number> = {
            regular: 5.99,
            express: 12.99,
            container: 25.99
        };
        return fees[shippingMethod];
    };

    const shippingFee = getShippingFee();
    const subtotal = product.price * quantity;
    const tax = subtotal * 0.1;
    const total = subtotal + shippingFee + tax;

    // Validasi form - button aktif ketika semua field terisi
    const isFormValid = 
        formData.fullName.trim() && 
        formData.streetAddress.trim() && 
        formData.city.trim() && 
        formData.postalCode.trim() && 
        formData.phoneNumber.trim();

    const handleQuantityChange = (change: number) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= 10) {
            setQuantity(newQuantity);
        }
    };

    const handleCheckout = () => {
        if (!isFormValid) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            Alert.alert(
                'Order Successful!',
                `Your order for ${product.name} has been placed successfully!\n\nTotal: $${total.toFixed(2)}`,
                [
                    {
                        text: 'Continue Shopping',
                        onPress: () => {
                            navigation.goBack();
                        },
                    },
                ]
            );
        }, 2000);
    };

    const handleClose = () => {
        navigation.goBack();
    };

    const updateFormData = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            visible={true}
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header dengan gradient */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <FontAwesome6 name="xmark" size={24} color="#ffffff" iconStyle='solid'/>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Product Summary */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome6 name="box" size={20} color="#4caf50"iconStyle='solid' />
                            <Text style={styles.sectionTitle}>Product Summary</Text>
                        </View>
                        <View style={styles.productSummary}>
                            <Image source={{ uri: product.image }} style={styles.productImage} />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {product.name}
                                </Text>
                                <Text style={styles.productCategory}>{product.category}</Text>
                                <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
                            </View>
                        </View>

                        {/* Quantity Selector */}
                        <View style={styles.quantitySection}>
                            <Text style={styles.quantityLabel}>Quantity:</Text>
                            <View style={styles.quantityControls}>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                >
                                    <FontAwesome6 name="minus" size={16} color={quantity <= 1 ? '#ccc' : '#ffffff'}iconStyle='solid' />
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{quantity}</Text>
                                <TouchableOpacity
                                    style={styles.quantityButton}
                                    onPress={() => handleQuantityChange(1)}
                                    disabled={quantity >= 10}
                                >
                                    <FontAwesome6 name="plus" size={16} color={quantity >= 10 ? '#ccc' : '#ffffff'}iconStyle='solid' />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Shipping Address */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome6 name="location-dot" size={20} color="#2196f3" iconStyle='solid'/>
                            <Text style={styles.sectionTitle}>Shipping Address</Text>
                        </View>

                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter your full name"
                                placeholderTextColor="#888"
                                value={formData.fullName}
                                onChangeText={(value) => updateFormData('fullName', value)}
                            />
                        </View>

                        {/* Street Address */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Street Address *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Street name and number"
                                placeholderTextColor="#888"
                                value={formData.streetAddress}
                                onChangeText={(value) => updateFormData('streetAddress', value)}
                            />
                        </View>

                        {/* City & Postal Code - Row */}
                        <View style={styles.rowInput}>
                            <View style={[styles.inputGroup, { flex: 2 }]}>
                                <Text style={styles.inputLabel}>City *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="City"
                                    placeholderTextColor="#888"
                                    value={formData.city}
                                    onChangeText={(value) => updateFormData('city', value)}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Postal Code *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="ZIP"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={formData.postalCode}
                                    onChangeText={(value) => updateFormData('postalCode', value)}
                                />
                            </View>
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Phone number"
                                placeholderTextColor="#888"
                                keyboardType="phone-pad"
                                value={formData.phoneNumber}
                                onChangeText={(value) => updateFormData('phoneNumber', value)}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome6 name="truck-fast" size={20} color='#dd901dff'iconStyle='solid' />
                            <Text style={styles.sectionTitle}>Shipping Method</Text>
                        </View>

                        {/* Regular Shipping */}
                        <TouchableOpacity
                            style={[
                                styles.shippingOption,
                                shippingMethod === 'regular' && styles.shippingOptionSelected
                            ]}
                            onPress={() => setShippingMethod('regular')}
                        >
                            <View style={styles.shippingIconContainer}>
                                <FontAwesome6 name="truck" size={20} color={shippingMethod === 'regular' ? '#4caf50' : '#dd901dff'}iconStyle='solid' />
                            </View>
                            <View style={styles.shippingInfo}>
                                <Text style={[
                                    styles.shippingName,
                                    shippingMethod === 'regular' && styles.shippingNameSelected
                                ]}>
                                    Regular Shipping
                                </Text>
                                <Text style={[
                                    styles.shippingDetails,
                                    shippingMethod === 'regular' && styles.shippingDetailsSelected
                                ]}>
                                    3-5 business days • $5.99
                                </Text>
                            </View>
                            <Text style={[
                                styles.shippingPrice,
                                shippingMethod === 'regular' && styles.shippingPriceSelected
                            ]}>
                                $5.99
                            </Text>
                        </TouchableOpacity>

                        {/* Express Shipping */}
                        <TouchableOpacity
                            style={[
                                styles.shippingOption,
                                shippingMethod === 'express' && styles.shippingOptionSelected
                            ]}
                            onPress={() => setShippingMethod('express')}
                        >
                            <View style={styles.shippingIconContainer}>
                                <FontAwesome6 name="bolt" size={20} color={shippingMethod === 'express' ? '#4caf50' : '#dd901dff'}iconStyle='solid' />
                            </View>
                            <View style={styles.shippingInfo}>
                                <Text style={[
                                    styles.shippingName,
                                    shippingMethod === 'express' && styles.shippingNameSelected
                                ]}>
                                    Express Shipping
                                </Text>
                                <Text style={[
                                    styles.shippingDetails,
                                    shippingMethod === 'express' && styles.shippingDetailsSelected
                                ]}>
                                    1-2 business days • $12.99
                                </Text>
                            </View>
                            <Text style={[
                                styles.shippingPrice,
                                shippingMethod === 'express' && styles.shippingPriceSelected
                            ]}>
                                $12.99
                            </Text>
                        </TouchableOpacity>

                        {/* Container Shipping */}
                        <TouchableOpacity
                            style={[
                                styles.shippingOption,
                                shippingMethod === 'container' && styles.shippingOptionSelected
                            ]}
                            onPress={() => setShippingMethod('container')}
                        >
                            <View style={styles.shippingIconContainer}>
                                <FontAwesome6 name="box" size={20} color={shippingMethod === 'container' ? '#4caf50' : '#dd901dff'} iconStyle='solid'/>
                            </View>
                            <View style={styles.shippingInfo}>
                                <Text style={[
                                    styles.shippingName,
                                    shippingMethod === 'container' && styles.shippingNameSelected
                                ]}>
                                    Container Shipping
                                </Text>
                                <Text style={[
                                    styles.shippingDetails,
                                    shippingMethod === 'container' && styles.shippingDetailsSelected
                                ]}>
                                    Bulk items • 7-14 days • $25.99
                                </Text>
                            </View>
                            <Text style={[
                                styles.shippingPrice,
                                shippingMethod === 'container' && styles.shippingPriceSelected
                            ]}>
                                $25.99
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Payment Method */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome6 name="credit-card" size={20} color='#3d68b6ff' />
                            <Text style={styles.sectionTitle}>Payment Method</Text>
                        </View>
                        <View style={styles.paymentOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.paymentOption,
                                    paymentMethod === 'credit_card' && styles.paymentOptionSelected
                                ]}
                                onPress={() => setPaymentMethod('credit_card')}
                            >
                                <View style={styles.paymentIconContainer}>
                                    <FontAwesome6 name="credit-card" size={20} color={paymentMethod === 'credit_card' ? '#278837ff' : '#3d68b6ff'} />
                                </View>
                                <Text style={[
                                    styles.paymentText,
                                    paymentMethod === 'credit_card' && styles.paymentTextSelected
                                ]}>Credit Card</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.paymentOption,
                                    paymentMethod === 'paypal' && styles.paymentOptionSelected
                                ]}
                                onPress={() => setPaymentMethod('paypal')}
                            >
                                <View style={styles.paymentIconContainer}>
                                    <FontAwesome6 name="paypal" size={20} color={paymentMethod === 'paypal' ? '#278837ff' : '#3d68b6ff'} iconStyle='brand' />
                                </View>
                                <Text style={[
                                    styles.paymentText,
                                    paymentMethod === 'paypal' && styles.paymentTextSelected
                                ]}>PayPal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.paymentOption,
                                    paymentMethod === 'bank_transfer' && styles.paymentOptionSelected
                                ]}
                                onPress={() => setPaymentMethod('bank_transfer')}
                            >
                                <View style={styles.paymentIconContainer}>
                                    <FontAwesome6 name="building-columns" size={20} color={paymentMethod === 'bank_transfer' ? '#278837ff' : '#3d68b6ff'}iconStyle='solid' />
                                </View>
                                <Text style={[
                                    styles.paymentText,
                                    paymentMethod === 'bank_transfer' && styles.paymentTextSelected
                                ]}>Bank Transfer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Order Summary */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FontAwesome6 name="receipt" size={20} color="#e91e63"iconStyle='solid' />
                            <Text style={styles.sectionTitle}>Order Summary</Text>
                        </View>
                        <View style={styles.orderSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal:</Text>
                                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping:</Text>
                                <Text style={styles.summaryValue}>${shippingFee.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Tax (10%):</Text>
                                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total:</Text>
                                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Checkout Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.checkoutButton,
                            (isProcessing || !isFormValid) && styles.checkoutButtonDisabled
                        ]}
                        onPress={handleCheckout}
                        disabled={isProcessing || !isFormValid}
                    >
                        {isProcessing ? (
                            <>
                                <FontAwesome6 name="spinner" size={16} color="#ffffff"iconStyle='solid' />
                                <Text style={styles.checkoutButtonText}> Processing...</Text>
                            </>
                        ) : (
                            <>
                                <FontAwesome6 name="bag-shopping" size={16} color="#ffffff"iconStyle='solid' />
                                <Text style={styles.checkoutButtonText}> Place Order - ${total.toFixed(2)}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f7f0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#2e7d32',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    closeButton: {
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: '#e8f5e9',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    productSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fff8',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e8f5e9',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#4caf50',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1b5e20',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 14,
        color: '#4caf50',
        fontWeight: '600',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    quantitySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e8f5e9',
    },
    quantityLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1b5e20',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#4caf50',
        padding: 8,
        borderRadius: 25,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2e7d32',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        minWidth: 24,
        textAlign: 'center',
    },
    textInput: {
        backgroundColor: '#f8fff8',
        borderWidth: 2,
        borderColor: '#c8e6c9',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1b5e20',
        fontWeight: '500',
    },
    paymentOptions: {
        gap: 12,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#c8e6c9',
        backgroundColor: '#f8fff8',
        gap: 16,
    },
    paymentOptionSelected: {
        borderColor: '#2e7d32',
        backgroundColor: '#2e7d32',
        elevation: 4,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    paymentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentText: {
        fontSize: 16,
        color: '#2e7d32',
        fontWeight: '600',
    },
    paymentTextSelected: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    orderSummary: {
        gap: 12,
        backgroundColor: '#f8fff8',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e8f5e9',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#4caf50',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        color: '#1b5e20',
        fontWeight: '600',
    },
    totalRow: {
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#4caf50',
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    footer: {
        padding: 20,
        backgroundColor: '#1b5e20',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    checkoutButton: {
        backgroundColor: '#4caf50',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    checkoutButtonDisabled: {
        backgroundColor: '#a5d6a7',
        elevation: 0,
        shadowOpacity: 0,
    },
    checkoutButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2e7d32',
        marginBottom: 8,
    },
    rowInput: {
        flexDirection: 'row',
        gap: 12,
    },
    shippingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#c8e6c9',
        backgroundColor: '#f8fff8',
        marginBottom: 12,
        gap: 16,
    },
    shippingOptionSelected: {
        borderColor: '#2e7d32',
        backgroundColor: '#2e7d32',
        elevation: 4,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    shippingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shippingInfo: {
        flex: 1,
    },
    shippingName: {
        fontSize: 16,
        color: '#2e7d32',
        fontWeight: '600',
        marginBottom: 4,
    },
    shippingNameSelected: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    shippingDetails: {
        fontSize: 12,
        color: '#4caf50',
        fontWeight: '500',
    },
    shippingDetailsSelected: {
        color: '#e8f5e9',
    },
    shippingPrice: {
        fontSize: 16,
        color: '#2e7d32',
        fontWeight: 'bold',
    },
    shippingPriceSelected: {
        color: '#ffffff',
    },
});

export default CheckoutModalScreen;