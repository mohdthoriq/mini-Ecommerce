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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, CartItem, Product } from '../../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type ModalCheckoutNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CheckoutModal'>;

// Mock Axios Interceptor (dalam aplikasi nyata, ini akan di setup di file terpisah)
const setupAxiosInterceptor = () => {
  // Simulasi interceptor yang akan menangkap error 400
  return {
    intercept: (callback: (errors: FormErrors) => void) => {
      // Dalam implementasi nyata, ini akan menjadi axios.interceptors.response.use()
      console.log('🛡️ Axios Response Interceptor configured');
    }
  };
};

// Type untuk form errors
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
  general?: string;
}

const CheckoutModalScreen = () => {
    const navigation = useNavigation<ModalCheckoutNavigationProp>();
    const route = useRoute();

    type ShippingMethod = 'standard' | 'express' | 'priority';
    type PaymentMethod = 'credit_card' | 'paypal' | 'apple_pay';

    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');

    // State untuk form data dengan validasi lebih lengkap
    const [formData, setFormData] = useState({
        // Shipping Information
        firstName: '',
        lastName: '',
        email: '',
        phone: '',

        // Address Information
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',

        // Payment Information (untuk credit card)
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
    });

    // State untuk form errors dari server
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Terima data dari route. Tipe sudah dijamin oleh HomeStackParamList.
    const { cartItems, subtotal = 0, discount = 0, shippingFee = 0, tax = 0, total = 0 } = (route.params as HomeStackParamList['CheckoutModal']) || {};

    const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(cartItems || []);

    // Setup Axios Interceptor ketika komponen mount
    React.useEffect(() => {
        const interceptor = setupAxiosInterceptor();
        interceptor.intercept((errors: FormErrors) => {
            console.log('🔴 Server validation errors:', errors);
            setFormErrors(errors);
            setIsProcessing(false);
        });
    }, []);

    const getShippingFee = (): number => {
        const fees: Record<ShippingMethod, number> = {
            standard: 4.99,
            express: 14.99,
            priority: 24.99
        };
        return fees[shippingMethod];
    };

    const getShippingTime = (): string => {
        const times: Record<ShippingMethod, string> = {
            standard: '5-7 business days',
            express: '2-3 business days',
            priority: '1-2 business days'
        };
        return times[shippingMethod];
    };

    // Validasi form yang lebih komprehensif
    const isFormValid =
        formData.firstName.trim() &&
        formData.lastName.trim() &&
        formData.email.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && // Email validation
        formData.phone.trim() &&
        formData.addressLine1.trim() &&
        formData.city.trim() &&
        formData.state.trim() &&
        formData.postalCode.trim() &&
        (paymentMethod !== 'credit_card' || (
            formData.cardNumber.replace(/\s/g, '').length === 16 &&
            formData.expiryDate.trim() &&
            formData.cvv.trim() &&
            formData.cardholderName.trim()
        ));

    const handleQuantityChange = (change: number) => {
        // Fungsi ini hanya relevan jika checkout dari 1 produk
        if (checkoutItems.length === 1) {
            const item = checkoutItems[0];
            const newQuantity = item.quantity + change;
            if (newQuantity >= 1 && newQuantity <= (item.product.stock || 10)) {
                const updatedItems = [{ ...item, quantity: newQuantity }];
                setCheckoutItems(updatedItems);
            }
        }
    };    

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
        const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
        return formatted.slice(0, 19); // 16 digits + 3 spaces
    };

    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    // Simulasi API call yang mungkin return error 400
    const mockApiCall = async (): Promise<{ success: boolean; errors?: any }> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulasi server validation error
                const hasError = Math.random() > 0.7; // 30% chance of error untuk testing
                
                if (hasError) {
                    resolve({
                        success: false,
                        errors: {
                            firstName: !formData.firstName ? 'First name is required' : undefined,
                            email: !formData.email ? 'Email is required' : 
                                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Invalid email format' : undefined,
                            addressLine1: !formData.addressLine1 ? 'Address is required' : undefined,
                            city: !formData.city ? 'City is required' : undefined,
                            postalCode: !formData.postalCode ? 'Postal code is required' : 
                                       formData.postalCode.length < 5 ? 'Postal code must be at least 5 characters' : undefined,
                            cardNumber: paymentMethod === 'credit_card' && !formData.cardNumber ? 'Card number is required' : undefined,
                        }
                    });
                } else {
                    resolve({ success: true });
                }
            }, 2000);
        });
    };

    const handleCheckout = async () => {
        if (!isFormValid) {
            Alert.alert('Incomplete Information', 'Please fill in all required fields correctly.');
            return;
        }

        setIsProcessing(true);
        setFormErrors({}); // Clear previous errors

        try {
            // Simulasi API call yang mungkin return validation errors
            const result = await mockApiCall();

            if (!result.success && result.errors) {
                // Simulasi Axios Interceptor menangkap error 400
                console.log('🔄 Interceptor capturing 400 error:', result.errors);
                setFormErrors(result.errors);
                setIsProcessing(false);
                return;
            }

            // Jika sukses, lanjutkan dengan order confirmation
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsProcessing(false);
            Alert.alert(
                '🎉 Order Confirmed!',
                `Thank you for your purchase of ${checkoutItems.length} item(s)!\n\nTotal: $${total.toFixed(2)}\n\nA confirmation email has been sent to ${formData.email}`,
                [
                    {
                        text: 'Continue Shopping',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            setIsProcessing(false);
            Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
        }
    };

    const handleClose = () => {
        if (isProcessing) return;
        Alert.alert(
            'Leave Checkout?',
            'Your progress will be lost if you leave this page.',
            [
                { text: 'Stay', style: 'cancel' },
                { text: 'Leave', onPress: () => navigation.goBack() }
            ]
        );
    };

    const updateFormData = (field: keyof typeof formData, value: string) => {
        let formattedValue = value;

        if (field === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (field === 'expiryDate') {
            formattedValue = formatExpiryDate(value);
        } else if (field === 'phone') {
            formattedValue = value.replace(/\D/g, '').slice(0, 15);
        }

        setFormData(prev => ({
            ...prev,
            [field]: formattedValue
        }));

        // Clear error when user starts typing
        if (formErrors[field as keyof FormErrors]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const InputField = ({
        label,
        field,
        placeholder,
        keyboardType = 'default',
        required = false,
        secureTextEntry = false
    }: {
        label: string;
        field: keyof typeof formData;
        placeholder: string;
        keyboardType?: any;
        required?: boolean;
        secureTextEntry?: boolean;
    }) => {
        const error = formErrors[field as keyof FormErrors];
        
        return (
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
                <TextInput
                    style={[
                        styles.textInput,
                        (!formData[field] && required) && styles.inputError,
                        error && styles.inputError
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor="#8a8a8a"
                    value={formData[field]}
                    onChangeText={(value) => updateFormData(field, value)}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={field === 'email' ? 'none' : 'words'}
                />
                {error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet"
            visible={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Professional Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Checkout</Text>
                        <Text style={styles.headerSubtitle}>Complete your purchase</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        disabled={isProcessing}
                    >
                        <FontAwesome6 name="xmark" size={20} color="#6b7280" iconStyle='solid' />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Progress Steps */}
                    <View style={styles.progressSteps}>
                        <View style={[styles.step, styles.stepActive]}>
                            <View style={styles.stepNumberActive}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepTextActive}>Shipping</Text>
                        </View>
                        <View style={styles.stepDivider} />
                        <View style={[styles.step, styles.stepActive]}>
                            <View style={styles.stepNumberActive}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepTextActive}>Payment</Text>
                        </View>
                        <View style={styles.stepDivider} />
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>Review</Text>
                        </View>
                    </View>

                    {/* Server Validation Error Banner */}
                    {formErrors.general && (
                        <View style={styles.serverErrorBanner}>
                            <FontAwesome6 name="triangle-exclamation" size={16} color="#ffffff" iconStyle='solid' />
                            <Text style={styles.serverErrorText}>
                                Please check the form for errors
                            </Text>
                        </View>
                    )}

                    {/* Product Summary Card */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                        {checkoutItems.map((item) => (
                            <View key={item.id} style={styles.productCard}>
                                <Image
                                    source={{ uri: item.product.image || item.product.thumbnail }}
                                    style={styles.productImage}
                                />
                                <View style={styles.productDetails}>
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {item.product.name}
                                    </Text>
                                    <Text style={styles.productCategory}>{item.product.category}</Text>
                                    <Text style={styles.productPrice}>
                                        ${item.product.price.toLocaleString()}
                                    </Text>

                                    {/* Quantity Controls (hanya jika 1 item) */}
                                    <View style={styles.quantitySection}>
                                        <Text style={styles.quantityLabel}>Quantity:</Text>
                                        {checkoutItems.length === 1 ? (
                                            <View style={styles.quantityControls}>
                                                <TouchableOpacity
                                                    style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
                                                    onPress={() => handleQuantityChange(-1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <FontAwesome6 name="minus" size={14} color={item.quantity <= 1 ? '#9ca3af' : '#374151'} iconStyle='solid' />
                                                </TouchableOpacity>
                                                <Text style={styles.quantityText}>{item.quantity}</Text>
                                                <TouchableOpacity
                                                    style={[styles.quantityButton, item.quantity >= (item.product.stock || 10) && styles.quantityButtonDisabled]}
                                                    onPress={() => handleQuantityChange(1)}
                                                    disabled={item.quantity >= (item.product.stock || 10)}
                                                >
                                                    <FontAwesome6 name="plus" size={14} color={item.quantity >= (item.product.stock || 10) ? '#9ca3af' : '#374151'} iconStyle='solid' />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <Text style={styles.quantityTextStatic}>{item.quantity}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Contact Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <View style={styles.rowInput}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <InputField
                                    label="First Name"
                                    field="firstName"
                                    placeholder="John"
                                    required
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <InputField
                                    label="Last Name"
                                    field="lastName"
                                    placeholder="Doe"
                                    required
                                />
                            </View>
                        </View>

                        <InputField
                            label="Email Address"
                            field="email"
                            placeholder="john.doe@example.com"
                            keyboardType="email-address"
                            required
                        />

                        <InputField
                            label="Phone Number"
                            field="phone"
                            placeholder="(555) 123-4567"
                            keyboardType="phone-pad"
                            required
                        />
                    </View>

                    {/* Shipping Address */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shipping Address</Text>

                        <InputField
                            label="Address Line 1"
                            field="addressLine1"
                            placeholder="Street address, P.O. box"
                            required
                        />

                        <InputField
                            label="Address Line 2"
                            field="addressLine2"
                            placeholder="Apartment, suite, unit, building, floor, etc."
                        />

                        <View style={styles.rowInput}>
                            <View style={[styles.inputGroup, { flex: 2 }]}>
                                <InputField
                                    label="City"
                                    field="city"
                                    placeholder="City"
                                    required
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <InputField
                                    label="State"
                                    field="state"
                                    placeholder="State"
                                    required
                                />
                            </View>
                        </View>

                        <View style={styles.rowInput}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <InputField
                                    label="Postal Code"
                                    field="postalCode"
                                    placeholder="ZIP code"
                                    keyboardType="numeric"
                                    required
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 2 }]}>
                                <InputField
                                    label="Country"
                                    field="country"
                                    placeholder="Country"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Shipping Method */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shipping Method</Text>

                        {(['standard', 'express', 'priority'] as ShippingMethod[]).map((method) => (
                            <TouchableOpacity
                                key={method}
                                style={[
                                    styles.shippingOption,
                                    shippingMethod === method && styles.shippingOptionSelected
                                ]}
                                onPress={() => setShippingMethod(method)}
                            >
                                <View style={styles.shippingRadio}>
                                    <View style={[
                                        styles.radioCircle,
                                        shippingMethod === method && styles.radioCircleSelected
                                    ]}>
                                        {shippingMethod === method && <View style={styles.radioInner} />}
                                    </View>
                                </View>
                                <View style={styles.shippingInfo}>
                                    <Text style={[
                                        styles.shippingName,
                                        shippingMethod === method && styles.shippingNameSelected
                                    ]}>
                                        {method.charAt(0).toUpperCase() + method.slice(1)} Shipping
                                    </Text>
                                    <Text style={[
                                        styles.shippingDetails,
                                        shippingMethod === method && styles.shippingDetailsSelected
                                    ]}>
                                        {getShippingTime()}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.shippingPrice,
                                    shippingMethod === method && styles.shippingPriceSelected
                                ]}>
                                    ${getShippingFee().toFixed(2)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Payment Method */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>

                        {/* Credit Card Option */}
                        <TouchableOpacity
                            style={[
                                styles.paymentOption,
                                paymentMethod === 'credit_card' && styles.paymentOptionSelected
                            ]}
                            onPress={() => setPaymentMethod('credit_card')}
                        >
                            <View style={styles.paymentRadio}>
                                <View style={[
                                    styles.radioCircle,
                                    paymentMethod === 'credit_card' && styles.radioCircleSelected
                                ]}>
                                    {paymentMethod === 'credit_card' && <View style={styles.radioInner} />}
                                </View>
                            </View>
                            <View style={styles.paymentIconContainer}>
                                <FontAwesome6
                                    name="credit-card"
                                    size={20}
                                    color={paymentMethod === 'credit_card' ? '#ffffff' : '#6b7280'}
                                />
                            </View>
                            <Text style={[
                                styles.paymentText,
                                paymentMethod === 'credit_card' && styles.paymentTextSelected
                            ]}>
                                Credit Card
                            </Text>
                        </TouchableOpacity>

                        {/* PayPal Option */}
                        <TouchableOpacity
                            style={[
                                styles.paymentOption,
                                paymentMethod === 'paypal' && styles.paymentOptionSelected
                            ]}
                            onPress={() => setPaymentMethod('paypal')}
                        >
                            <View style={styles.paymentRadio}>
                                <View style={[
                                    styles.radioCircle,
                                    paymentMethod === 'paypal' && styles.radioCircleSelected
                                ]}>
                                    {paymentMethod === 'paypal' && <View style={styles.radioInner} />}
                                </View>
                            </View>
                            <View style={styles.paymentIconContainer}>
                                <FontAwesome6
                                    name="paypal"
                                    size={20}
                                    color={paymentMethod === 'paypal' ? '#ffffff' : '#6b7280'}
                                    iconStyle='brand'
                                />
                            </View>
                            <Text style={[
                                styles.paymentText,
                                paymentMethod === 'paypal' && styles.paymentTextSelected
                            ]}>
                                PayPal
                            </Text>
                        </TouchableOpacity>

                        {/* Apple Pay Option */}
                        <TouchableOpacity
                            style={[
                                styles.paymentOption,
                                paymentMethod === 'apple_pay' && styles.paymentOptionSelected
                            ]}
                            onPress={() => setPaymentMethod('apple_pay')}
                        >
                            <View style={styles.paymentRadio}>
                                <View style={[
                                    styles.radioCircle,
                                    paymentMethod === 'apple_pay' && styles.radioCircleSelected
                                ]}>
                                    {paymentMethod === 'apple_pay' && <View style={styles.radioInner} />}
                                </View>
                            </View>
                            <View style={styles.paymentIconContainer}>
                                <FontAwesome6
                                    name="apple"
                                    size={20}
                                    color={paymentMethod === 'apple_pay' ? '#ffffff' : '#6b7280'}
                                    iconStyle='brand'
                                />
                            </View>
                            <Text style={[
                                styles.paymentText,
                                paymentMethod === 'apple_pay' && styles.paymentTextSelected
                            ]}>
                                Apple Pay
                            </Text>
                        </TouchableOpacity>

                        {/* Credit Card Details */}
                        {paymentMethod === 'credit_card' && (
                            <View style={styles.cardDetails}>
                                <InputField
                                    label="Cardholder Name"
                                    field="cardholderName"
                                    placeholder="John Doe"
                                    required
                                />

                                <InputField
                                    label="Card Number"
                                    field="cardNumber"
                                    placeholder="1234 5678 9012 3456"
                                    keyboardType="numeric"
                                    required
                                />

                                <View style={styles.rowInput}>
                                    <View style={[styles.inputGroup, { flex: 2 }]}>
                                        <InputField
                                            label="Expiry Date"
                                            field="expiryDate"
                                            placeholder="MM/YY"
                                            keyboardType="numeric"
                                            required
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <InputField
                                            label="CVV"
                                            field="cvv"
                                            placeholder="123"
                                            keyboardType="numeric"
                                            secureTextEntry
                                            required
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Order Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Total</Text>
                        <View style={styles.orderSummary}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal ({checkoutItems.reduce((sum, i) => sum + i.quantity, 0)} items)</Text>
                                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping</Text>
                                <Text style={styles.summaryValue}>${shippingFee.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Tax</Text>
                                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Security Badge */}
                    <View style={styles.securitySection}>
                        <FontAwesome6 name="shield" size={16} color="#10b981" iconStyle='solid' />
                        <Text style={styles.securityText}>
                            Your payment information is secure and encrypted
                        </Text>
                    </View>
                </ScrollView>

                {/* Fixed Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <View style={styles.totalContainer}>
                            <Text style={styles.footerTotalLabel}>Total Amount</Text>
                            <Text style={styles.footerTotalValue}>${total.toFixed(2)}</Text>
                        </View>
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
                                    <FontAwesome6 name="spinner" size={16} color="#ffffff" iconStyle='solid' />
                                    <Text style={styles.checkoutButtonText}> Processing Payment...</Text>
                                </>
                            ) : (
                                <>
                                    <FontAwesome6 name="lock" size={16} color="#ffffff" iconStyle='solid' />
                                    <Text style={styles.checkoutButtonText}> Pay ${total.toFixed(2)}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#9bf89bff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 24,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    closeButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
    },
    progressSteps: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    step: {
        alignItems: 'center',
        flex: 1,
    },
    stepActive: {
        // Active step styles
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepNumberActive: {
        backgroundColor: '#10b981',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
    },
    stepText: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    stepTextActive: {
        color: '#10b981',
        fontWeight: '600',
    },
    stepDivider: {
        flex: 1,
        height: 2,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 8,
        marginBottom: 20,
    },
    // Server Error Styles
    serverErrorBanner: {
        backgroundColor: '#dc2626',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    serverErrorText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    section: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
        marginBottom: 12,
    },
    quantitySection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 4,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonDisabled: {
        backgroundColor: '#f3f4f6',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginHorizontal: 16,
        minWidth: 20,
        textAlign: 'center',
    },
    quantityTextStatic: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    textInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    inputError: {
        borderColor: '#dc2626',
    },
    rowInput: {
        flexDirection: 'row',
        gap: 12,
    },
    shippingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        marginBottom: 8,
    },
    shippingOptionSelected: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    shippingRadio: {
        marginRight: 12,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: '#10b981',
        backgroundColor: '#10b981',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
    },
    shippingInfo: {
        flex: 1,
    },
    shippingName: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
        marginBottom: 4,
    },
    shippingNameSelected: {
        color: '#065f46',
        fontWeight: '600',
    },
    shippingDetails: {
        fontSize: 14,
        color: '#6b7280',
    },
    shippingDetailsSelected: {
        color: '#047857',
    },
    shippingPrice: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '600',
    },
    shippingPriceSelected: {
        color: '#065f46',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
        marginBottom: 8,
    },
    paymentOptionSelected: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    paymentRadio: {
        marginRight: 12,
    },
    paymentIconContainer: {
        marginRight: 12,
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    paymentTextSelected: {
        color: '#065f46',
        fontWeight: '600',
    },
    cardDetails: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    orderSummary: {
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    totalRow: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#059669',
    },
    securitySection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
    },
    securityText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    totalContainer: {
        flex: 1,
    },
    footerTotalLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    footerTotalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#059669',
    },
    checkoutButton: {
        flex: 2,
        backgroundColor: '#059669',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    checkoutButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    checkoutButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default CheckoutModalScreen;