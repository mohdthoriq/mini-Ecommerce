
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    Linking,
    PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, CartItem, Product } from '../../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { simplePrompt } from '../../utils/simplePrompt';
import Geolocation from '@react-native-community/geolocation';
import { Animated, Easing } from 'react-native';
import { useCart } from '../../context/CartContext';

type ModalCheckoutNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CheckoutModal'>;

// Fungsi untuk request permission lokasi
const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        return true;
    }

    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Izin Akses Lokasi',
                message: 'Kami butuh lokasi Anda untuk menghitung ongkir secara akurat.',
                buttonNeutral: 'Tanya Nanti',
                buttonNegative: 'Tolak',
                buttonPositive: 'Izinkan',
            }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
    }
};

// Mock Axios Interceptor
const setupAxiosInterceptor = () => {
    return {
        intercept: (callback: (errors: FormErrors) => void) => {
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
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
    general?: string;
}

// Fungsi untuk mendapatkan lokasi
const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise(async (resolve, reject) => {
        try {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                reject(new Error('LOCATION_PERMISSION_DENIED'));
                return;
            }

            console.log('📍 Mencoba mendapatkan lokasi...');

            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('✅ Lokasi berhasil didapatkan:', { latitude, longitude });
                    resolve({ latitude, longitude });
                },
                (error) => {
                    console.error('❌ Error mendapatkan lokasi:', error);
                    let errorType = 'UNKNOWN_ERROR';

                    switch (error.code) {
                        case 1:
                            errorType = 'PERMISSION_DENIED';
                            break;
                        case 2:
                            errorType = 'POSITION_UNAVAILABLE';
                            break;
                        case 3:
                            errorType = 'TIMEOUT';
                            break;
                    }
                    reject(new Error(errorType));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000,
                }
            );
        } catch (error) {
            reject(error);
        }
    });
};

// Fungsi untuk menghitung ongkir
const calculateShippingCost = async (): Promise<{ cost: number; usedFallback: boolean; message?: string }> => {
    try {
        console.log('🚚 Menghitung ongkir berdasarkan lokasi...');
        const location = await getCurrentLocation();
        console.log('📍 Lokasi user:', location);

        const baseCost = 4.99;
        const distanceMultiplier = Math.random() * 2 + 0.5;
        const shippingCost = baseCost * distanceMultiplier;

        return {
            cost: parseFloat(shippingCost.toFixed(2)),
            usedFallback: false
        };

    } catch (error: any) {
        console.error('❌ Gagal menghitung ongkir:', error.message);
        return {
            cost: 4.99,
            usedFallback: true,
            message: 'Menggunakan tarif ongkir standar.'
        };
    }
};

const SpinningIcon = ({ size = 16, color = '#fff' }) => {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();
    }, []);

    const rotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <FontAwesome6 name="spinner" size={size} color={color} iconStyle='solid' />
        </Animated.View>
    );
};

// Komponen InputField yang di-memoize untuk prevent re-render
const InputField = React.memo(({
    label,
    value,
    placeholder,
    keyboardType = 'default',
    required = false,
    secureTextEntry = false,
    error,
    onChangeText,
    autoCapitalize = 'none'
}: {
    label: string;
    value: string;
    placeholder: string;
    keyboardType?: any;
    required?: boolean;
    secureTextEntry?: boolean;
    error?: string;
    onChangeText: (text: string) => void;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) => {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
                style={[
                    styles.textInput,
                    (!value && required) && styles.inputError,
                    error && styles.inputError
                ]}
                placeholder={placeholder}
                placeholderTextColor="#8a8a8a"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
            />
            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
});

const CheckoutModalScreen = () => {
    const navigation = useNavigation<ModalCheckoutNavigationProp>();
    const route = useRoute();
    const { clearCartAfterCheckout } = useCart();


    type ShippingMethod = 'standard' | 'express' | 'priority';
    type PaymentMethod = 'credit_card' | 'paypal' | 'apple_pay';

    // Pisahkan state untuk mencegah re-render berlebihan
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
    const [shippingCalculationMessage, setShippingCalculationMessage] = useState<string>('');

    // Pisahkan state per field untuk optimasi performance
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardholderName, setCardholderName] = useState('');

    // State untuk form errors
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Terima data dari route
    const { cartItems, subtotal = 0, discount = 0, tax = 0 } = (route.params as HomeStackParamList['CheckoutModal']) || {};

    const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(cartItems || []);
    const [shippingFee, setShippingFee] = useState<number>(4.99);
    const [total, setTotal] = useState<number>(subtotal + 4.99 + tax);

    // Setup Axios Interceptor - pake useCallback untuk prevent re-render
    React.useEffect(() => {
        const interceptor = setupAxiosInterceptor();
        interceptor.intercept((errors: FormErrors) => {
            console.log('🔴 Server validation errors:', errors);
            setFormErrors(errors);
            setIsProcessing(false);
        });
    }, []);

    // Hitung ulang total - optimasi dependency array
    React.useEffect(() => {
        const newTotal = subtotal + shippingFee + tax;
        setTotal(newTotal);
    }, [subtotal, shippingFee, tax]);

    const getShippingFee = (): number => {
        return shippingFee;
    };

    const getShippingTime = (): string => {
        const times: Record<ShippingMethod, string> = {
            standard: '5-7 business days',
            express: '2-3 business days',
            priority: '1-2 business days'
        };
        return times[shippingMethod];
    };

    // Fungsi untuk menghitung ongkir - pake useCallback
    const handleCalculateShipping = useCallback(async () => {
        try {
            setIsCalculatingShipping(true);
            setShippingCalculationMessage('');

            const result = await calculateShippingCost();
            setShippingFee(result.cost);

            if (result.usedFallback && result.message) {
                setShippingCalculationMessage(result.message);
            } else {
                setShippingCalculationMessage(`Ongkir berhasil dihitung berdasarkan lokasi Anda: $${result.cost.toFixed(2)}`);
            }

        } catch (error: any) {
            console.error('❌ Gagal menghitung ongkir:', error);
            setShippingCalculationMessage('Gagal menghitung ongkir. Menggunakan tarif standar.');
        } finally {
            setIsCalculatingShipping(false);
        }
    }, []);

    // Validasi form
    const isFormValid =
        firstName.trim() &&
        lastName.trim() &&
        email.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        phone.trim() &&
        (paymentMethod !== 'credit_card' || (
            cardNumber.replace(/\s/g, '').length === 16 &&
            expiryDate.trim() &&
            cvv.trim() &&
            cardholderName.trim()
        ));

    // Format functions - pake useCallback
    const formatCardNumber = useCallback((text: string) => {
        const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
        const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
        return formatted.slice(0, 19);
    }, []);

    const formatExpiryDate = useCallback((text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    }, []);

    // Handler functions - pake useCallback
    const handleCardNumberChange = useCallback((text: string) => {
        const formatted = formatCardNumber(text);
        setCardNumber(formatted);
        if (formErrors.cardNumber) {
            setFormErrors(prev => ({ ...prev, cardNumber: undefined }));
        }
    }, [formatCardNumber, formErrors.cardNumber]);

    const handleExpiryDateChange = useCallback((text: string) => {
        const formatted = formatExpiryDate(text);
        setExpiryDate(formatted);
        if (formErrors.expiryDate) {
            setFormErrors(prev => ({ ...prev, expiryDate: undefined }));
        }
    }, [formatExpiryDate, formErrors.expiryDate]);

    const handlePhoneChange = useCallback((text: string) => {
        const formatted = text.replace(/\D/g, '').slice(0, 15);
        setPhone(formatted);
        if (formErrors.phone) {
            setFormErrors(prev => ({ ...prev, phone: undefined }));
        }
    }, [formErrors.phone]);

    // Process payment
    const processPayment = async (): Promise<{ success: boolean; orderId: string }> => {
        try {
            console.log('💳 Memproses pembayaran...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            const isSuccess = Math.random() > 0.1;

            if (isSuccess) {
                const orderId = 'ORD-' + Date.now().toString().slice(-6);
                console.log('✅ Pembayaran berhasil, Order ID:', orderId);
                return { success: true, orderId };
            } else {
                throw new Error('Pembayaran gagal - Saldo tidak cukup');
            }
        } catch (error: any) {
            console.error('❌ Pembayaran gagal:', error.message);
            throw error;
        }
    };

    // Handle checkout
    const handleCheckoutWithConfirmation = async () => {
        if (!isFormValid) {
            Alert.alert('Informasi Tidak Lengkap', 'Harap lengkapi semua field yang diperlukan.');
            return;
        }

        try {
            const confirmation = await simplePrompt(
                `Konfirmasi Pembayaran $${total.toFixed(2)}`,
                {
                    confirmText: 'Bayar Sekarang',
                    cancelText: 'Batalkan',
                    title: 'Konfirmasi Pembayaran',
                    type: 'warning'
                }
            );

            if (confirmation.success) {
                setIsProcessing(true);
                
                try {
                    const paymentResult = await processPayment();
                    
                    if (paymentResult.success) {
                        setIsProcessing(false);
                        
                        // ✅ PERBAIKAN: Buat data order yang lengkap dan konsisten
                        const orderData = {
                            orderId: paymentResult.orderId,
                            total: total, // ✅ PASTIKAN PAKAI TOTAL YANG BENAR
                            subtotal: subtotal,
                            shippingFee: shippingFee,
                            tax: tax,
                            discount: discount,
                            items: checkoutItems,
                            customerInfo: {
                                firstName,
                                lastName,
                                email,
                                phone
                            },
                            shippingMethod: shippingMethod,
                            paymentMethod: paymentMethod,
                            estimatedDelivery: getShippingTime(),
                            timestamp: new Date().toISOString()
                        };

                        console.log('📦 Data order yang dikirim:', orderData);

                        // ✅ PERBAIKAN: Clear cart setelah checkout berhasil
                        try {
                            await clearCartAfterCheckout();
                            console.log('✅ Cart cleared after checkout');
                        } catch (cartError) {
                            console.warn('⚠️ Gagal clear cart:', cartError);
                        }

                        // ✅ PERBAIKAN: Navigasi dengan data yang lengkap
                        Alert.alert(
                            '🎉 Pembayaran Berhasil!',
                            `Terima kasih telah berbelanja!\n\nTotal: $${total.toFixed(2)}\nOrder ID: ${paymentResult.orderId}\n\nEmail konfirmasi telah dikirim ke ${email}`,
                            [
                                {
                                    text: 'Lacak Pesanan',
                                    onPress: () => {
                                        // ✅ PERBAIKAN: Kirim data yang lengkap ke tracking screen
                                        navigation.navigate('CourierTracking', {
                                            order: orderData, // ✅ KIRIM OBJECT ORDER YANG LENGKAP
                                            orderId: paymentResult.orderId,
                                            total: total, // ✅ PASTIKAN TOTAL YANG DIKIRIM SAMA
                                            estimatedTime: getShippingTime(),
                                            customerName: `${firstName} ${lastName}`,
                                            items: checkoutItems.map(item => ({
                                                name: item.product.name,
                                                quantity: item.quantity,
                                                price: item.product.price,
                                                total: item.product.price * item.quantity
                                            })),
                                            subtotal: subtotal,
                                            shippingFee: shippingFee,
                                            tax: tax,
                                            discount: discount
                                        });
                                    }
                                },
                            ]
                        );

                    }
                } catch (paymentError: any) {
                    setIsProcessing(false);
                    Alert.alert(
                        '❌ Pembayaran Gagal',
                        paymentError.message || 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.'
                    );
                }
            } else {
                Alert.alert('Transaksi Dibatalkan', confirmation.message || 'Transaksi telah dibatalkan.');
            }
        } catch (error) {
            console.error('❌ Error dalam proses checkout:', error);
            Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
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
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                {/* Header */}
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
                    keyboardShouldPersistTaps="handled" // Penting untuk prevent keyboard close
                    keyboardDismissMode="none" // Jangan auto dismiss keyboard
                >
                    {/* Progress Steps */}
                    <View style={styles.progressSteps}>
                        <View style={[styles.step, styles.stepActive]}>
                            <View style={styles.stepNumberActive}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepTextActive}>Contact</Text>
                        </View>
                        <View style={styles.stepDivider} />
                        <View style={[styles.step, styles.stepActive]}>
                            <View style={styles.stepNumberActive}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepTextActive}>Payment</Text>
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
                                    <View style={styles.quantitySection}>
                                        <Text style={styles.quantityLabel}>Quantity: {item.quantity}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Contact Information - FIXED dengan state terpisah */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <View style={styles.rowInput}>
                            <InputField
                                label="First Name"
                                value={firstName}
                                placeholder="John"
                                required
                                error={formErrors.firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                            />
                            <InputField
                                label="Last Name"
                                value={lastName}
                                placeholder="Doe"
                                required
                                error={formErrors.lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words"
                            />
                        </View>

                        <InputField
                            label="Email Address"
                            value={email}
                            placeholder="john.doe@example.com"
                            keyboardType="email-address"
                            required
                            error={formErrors.email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />

                        <InputField
                            label="Phone Number"
                            value={phone}
                            placeholder="(555) 123-4567"
                            keyboardType="phone-pad"
                            required
                            error={formErrors.phone}
                            onChangeText={handlePhoneChange}
                        />
                    </View>

                    {/* Shipping Method */}
                    <View style={styles.section}>
                        <View style={styles.shippingHeader}>
                            <Text style={styles.sectionTitle}>Shipping Method</Text>
                            <TouchableOpacity
                                style={[
                                    styles.calculateShippingButton,
                                    isCalculatingShipping && styles.calculateShippingButtonDisabled
                                ]}
                                onPress={handleCalculateShipping}
                                disabled={isCalculatingShipping}
                            >
                                {isCalculatingShipping ? (
                                    <SpinningIcon size={14} color="#ffffff" />
                                ) : (
                                    <FontAwesome6 name="location-crosshairs" size={14} color="#ffffff" iconStyle='solid' />
                                )}
                                <Text style={styles.calculateShippingText}>
                                    {isCalculatingShipping ? 'Calculating...' : 'Auto Calculate'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Shipping Calculation Message */}
                        {shippingCalculationMessage ? (
                            <View style={[
                                styles.shippingMessage,
                                shippingCalculationMessage.includes('berhasil')
                                    ? styles.shippingMessageSuccess
                                    : styles.shippingMessageWarning
                            ]}>
                                <FontAwesome6
                                    name={shippingCalculationMessage.includes('berhasil') ? "check" : "info"}
                                    size={14}
                                    color="#ffffff"
                                    iconStyle='solid'
                                />
                                <Text style={styles.shippingMessageText}>
                                    {shippingCalculationMessage}
                                </Text>
                            </View>
                        ) : null}

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
                            onPress={handleCheckoutWithConfirmation}
                            disabled={isProcessing || !isFormValid}
                        >
                            {isProcessing ? (
                                <>
                                    <SpinningIcon size={14} color="#ffffff" />
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

// Styles dengan tambahan untuk shipping calculation dan message
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#9bf89bff',
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
    shippingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calculateShippingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    calculateShippingButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    calculateShippingText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    shippingMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    shippingMessageSuccess: {
        backgroundColor: '#10b981',
    },
    shippingMessageWarning: {
        backgroundColor: '#f59e0b',
    },
    shippingMessageText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
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