import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Product } from '../../types';
import { useCart } from '../../context/CartContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useAuth } from '../../context/AuthContext';
import NetInfo from '@react-native-community/netinfo';

type CartScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Cart'>;

const CartScreen = () => {
    const navigation = useNavigation<CartScreenNavigationProp>();
    const { user } = useAuth();
    const {
        cartItems,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartItemCount,
        totalPrice,
        refreshCart,
        isCartLoading,
        lastCartError
    } = useCart();
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(false);
    const [pollingCount, setPollingCount] = useState(0);
    const [lastUpdate, setLastUpdate] = useState<string>('Just now');
    const [connectionType, setConnectionType] = useState<string | null>(null);

    // ✅ Effect untuk handle cart errors
    useEffect(() => {
        if (lastCartError) {
            Alert.alert(
                'Cart Error',
                lastCartError,
                [
                    { 
                        text: 'Clear Cart', 
                        onPress: () => handleClearCart(),
                        style: 'destructive'
                    },
                    { 
                        text: 'Retry', 
                        onPress: () => handleRefreshCart()
                    },
                    { 
                        text: 'Ignore', 
                        style: 'cancel' 
                    }
                ]
            );
        }
    }, [lastCartError]);

    // ✅ POLLING IMPLEMENTATION dengan optimasi bandwidth
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const startPolling = () => {
            console.log('🔄 Starting cart polling...');
            intervalId = setInterval(async () => {
                try {
                    console.log('📡 Polling cart data...');
                    await refreshCart(); // Panggil API untuk refresh data cart
                    setPollingCount(prev => prev + 1);
                    setLastUpdate(new Date().toLocaleTimeString());

                    console.log('✅ Cart data updated via polling');
                } catch (error) {
                    console.error('❌ Polling error:', error);
                }
            }, 15000); // Poll setiap 15 detik
        };

        const stopPolling = () => {
            console.log('🛑 Stopping cart polling');
            if (intervalId) {
                clearInterval(intervalId);
            }
        };

        // Subscribe to network info changes
        const unsubscribeNetInfo = NetInfo.addEventListener(state => {
            const newConnectionType = state.type;
            setConnectionType(newConnectionType);

            console.log('🌐 Connection type changed:', newConnectionType);

            // ✅ OPTIMASI BANDWIDTH: Hentikan polling jika jaringan seluler
            if (newConnectionType === 'cellular') {
                console.log('📱 Cellular network detected - stopping polling to save data');
                stopPolling();
            } else if (newConnectionType === 'wifi' || newConnectionType === 'unknown') {
                console.log('📶 WiFi or unknown network - starting polling');
                stopPolling(); // Stop dulu untuk menghindari duplicate intervals
                startPolling();
            }
        });

        // Start polling initially
        startPolling();

        // Cleanup function
        return () => {
            console.log('🧹 Cleaning up polling interval');
            stopPolling();
            unsubscribeNetInfo();
        };
    }, [refreshCart]);

    // ✅ Optimized quantity update dengan error handling
    const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
        try {
            await updateQuantity(productId, newQuantity);
        } catch (error: any) {
            Alert.alert('Update Failed', error.message || 'Failed to update quantity');
        }
    };

    // ✅ Optimized remove item dengan error handling
    const handleRemoveItem = async (itemId: string) => {
        Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeFromCart(itemId);
                        } catch (error: any) {
                            Alert.alert('Remove Failed', error.message || 'Failed to remove item');
                        }
                    }
                }
            ]
        );
    };

    // ✅ Handle clear cart dengan confirmation
    const handleClearCart = async () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to clear your entire cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearCart();
                            Alert.alert('Success', 'Cart cleared successfully');
                        } catch (error: any) {
                            Alert.alert('Clear Failed', error.message || 'Failed to clear cart');
                        }
                    }
                }
            ]
        );
    };

    // ✅ Function untuk manual refresh dengan error handling
    const handleManualRefresh = async () => {
        if (connectionType === 'cellular') {
            Alert.alert(
                'Data Saving Mode',
                'Polling is disabled on cellular network to save your data. Please connect to WiFi for automatic updates.',
                [{ text: 'OK' }]
            );
            return;
        }

        setLoading(true);
        try {
            await refreshCart();
            setLastUpdate(new Date().toLocaleTimeString());
            Alert.alert('Success', 'Cart updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to refresh cart');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Refresh cart function dengan error handling
    const handleRefreshCart = async () => {
        try {
            setLoading(true);
            await refreshCart();
            setLastUpdate(new Date().toLocaleTimeString());
        } catch (error: any) {
            Alert.alert('Refresh Failed', error.message || 'Failed to refresh cart');
        } finally {
            setLoading(false);
        }
    };

    const applyCoupon = () => {
        if (!couponCode.trim()) {
            Alert.alert('Error', 'Please enter a coupon code');
            return;
        }

        // Simulasi coupon validation
        const validCoupons = ['SAVE10', 'WELCOME15', 'SUMMER20'];
        if (validCoupons.includes(couponCode.toUpperCase())) {
            setAppliedCoupon(true);
            Alert.alert('Success', 'Coupon applied successfully!');
        } else {
            Alert.alert('Invalid Coupon', 'The coupon code you entered is invalid.');
        }
    };

    const getSubtotal = () => {
        return totalPrice;
    };

    const getDiscount = () => {
        if (!appliedCoupon) return 0;
        return getSubtotal() * 0.1; // 10% discount
    };

    const getShippingFee = () => {
        return getSubtotal() > 100 ? 0 : 9.99; // Free shipping over $100
    };

    const getTax = () => {
        return (getSubtotal() - getDiscount()) * 0.0825; // 8.25% tax
    };

    const getTotal = () => {
        return getSubtotal() - getDiscount() + getShippingFee() + getTax();
    };

    const proceedToCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty. Add some items before checkout.');
            return;
        }

        // Navigate to checkout with all cart items
        navigation.navigate('CheckoutModal', {
            cartItems,
            subtotal: getSubtotal(),
            discount: getDiscount(),
            shippingFee: getShippingFee(),
            tax: getTax(),
            total: getTotal()
        });
    };

    const continueShopping = () => {
        navigation.goBack();
    };

    // ✅ Tampilkan status error banner
    const renderErrorBanner = () => {
        if (!lastCartError) return null;

        return (
            <View style={styles.errorBanner}>
                <FontAwesome6 name="triangle-exclamation" size={16} color="#ffffff" iconStyle='solid' />
                <Text style={styles.errorBannerText}>{lastCartError}</Text>
                <TouchableOpacity 
                    onPress={handleRefreshCart}
                    style={styles.retryButtonSmall}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ✅ Tampilkan status polling dan koneksi
    const renderPollingStatus = () => (
        <View style={styles.pollingStatus}>
            <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Auto-refresh:</Text>
                <View style={[
                    styles.statusIndicator,
                    connectionType === 'cellular' ? styles.statusDisabled : styles.statusActive
                ]}>
                    <Text style={styles.statusText}>
                        {connectionType === 'cellular' ? 'Disabled (Cellular)' : 'Active'}
                    </Text>
                </View>
            </View>
            <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last updated:</Text>
                <Text style={styles.statusValue}>{lastUpdate}</Text>
            </View>
            {connectionType === 'cellular' && (
                <TouchableOpacity style={styles.manualRefreshButton} onPress={handleManualRefresh}>
                    <FontAwesome6 name="rotate" size={14} color="#ffffff" iconStyle='solid' />
                    <Text style={styles.manualRefreshText}>Refresh Now</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // ✅ Loading state untuk cart operations
    if (isCartLoading && cartItems.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading your cart...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header dengan status polling dan error indicator */}
            <View style={styles.header}>
                <View style={styles.headerMain}>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Shopping Cart</Text>
                        {lastCartError && (
                            <TouchableOpacity 
                                style={styles.errorIndicator}
                                onPress={handleRefreshCart}
                            >
                                <FontAwesome6 name="triangle-exclamation" size={16} color="#ffffff" iconStyle='solid' />
                            </TouchableOpacity>
                        )}
                    </View>
                    {cartItems.length > 0 && (
                        <TouchableOpacity 
                            style={styles.clearCartButton}
                            onPress={handleClearCart}
                        >
                            <FontAwesome6 name="broom" size={16} color="#ef4444" iconStyle='solid' />
                            <Text style={styles.clearCartText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {renderPollingStatus()}
            </View>

            {/* Error Banner */}
            {renderErrorBanner()}

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={handleRefreshCart}
                        colors={['#10b981']}
                        tintColor="#10b981"
                    />
                }
            >
                {cartItems.length === 0 ? (
                    // Empty Cart State
                    <View style={styles.emptyContainer}>
                        <FontAwesome6 name="cart-shopping" size={80} color="#d1d5db" iconStyle='solid' />
                        <Text style={styles.emptyTitle}>Your cart is empty</Text>
                        <Text style={styles.emptySubtitle}>
                            Browse our products and add items to your cart
                        </Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={continueShopping}
                        >
                            <Text style={styles.shopButtonText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Cart Items
                    <>
                        {/* Cart Items List */}
                        <View style={styles.cartItemsSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    Cart Items ({cartItemCount})
                                </Text>
                                {isCartLoading && (
                                    <ActivityIndicator size="small" color="#10b981" />
                                )}
                            </View>
                            {cartItems.map((item) => (
                                <View key={item.id} style={styles.cartItem}>
                                    <Image
                                        source={{ uri: item.product.image }}
                                        style={styles.productImage}
                                    />
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.productName} numberOfLines={2}>
                                            {item.product.name}
                                        </Text>
                                        {item.product.brand && (
                                            <Text style={styles.productBrand}>
                                                {item.product.brand}
                                            </Text>
                                        )}
                                        <Text style={styles.productPrice}>
                                            ${item.product.price.toLocaleString()}
                                        </Text>

                                        {/* Quantity Controls */}
                                        <View style={styles.quantityContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.quantityButton,
                                                    item.quantity <= 1 && styles.quantityButtonDisabled
                                                ]}
                                                onPress={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1 || isCartLoading}
                                            >
                                                <FontAwesome6 
                                                    name="minus" 
                                                    size={12} 
                                                    color={item.quantity <= 1 ? '#9ca3af' : '#374151'} 
                                                    iconStyle='solid' 
                                                />
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{item.quantity}</Text>
                                            <TouchableOpacity
                                                style={[
                                                    styles.quantityButton,
                                                    item.quantity >= (item.product.stock || 10) && styles.quantityButtonDisabled
                                                ]}
                                                onPress={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                                                disabled={item.quantity >= (item.product.stock || 10) || isCartLoading}
                                            >
                                                <FontAwesome6 
                                                    name="plus" 
                                                    size={12} 
                                                    color={item.quantity >= (item.product.stock || 10) ? '#9ca3af' : '#374151'} 
                                                    iconStyle='solid' 
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Item Total & Remove */}
                                    <View style={styles.itemActions}>
                                        <Text style={styles.itemTotal}>
                                            ${(item.product.price * item.quantity).toLocaleString()}
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => handleRemoveItem(item.product.id)}
                                            disabled={isCartLoading}
                                        >
                                            <FontAwesome6 name="trash" size={16} color="#ef4444" iconStyle='solid' />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Coupon Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Have a coupon?</Text>
                            <View style={styles.couponContainer}>
                                <TextInput
                                    style={styles.couponInput}
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChangeText={setCouponCode}
                                    editable={!appliedCoupon && !isCartLoading}
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.couponButton,
                                        appliedCoupon && styles.couponButtonApplied,
                                        isCartLoading && styles.buttonDisabled
                                    ]}
                                    onPress={appliedCoupon ? () => setAppliedCoupon(false) : applyCoupon}
                                    disabled={isCartLoading}
                                >
                                    <Text style={styles.couponButtonText}>
                                        {appliedCoupon ? 'Applied' : 'Apply'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Order Summary */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Order Summary</Text>
                            <View style={styles.summary}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>
                                        ${getSubtotal().toFixed(2)}
                                    </Text>
                                </View>

                                {appliedCoupon && (
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryLabel, styles.discountText]}>
                                            Discount (10%)
                                        </Text>
                                        <Text style={[styles.summaryValue, styles.discountText]}>
                                            -${getDiscount().toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Shipping</Text>
                                    <Text style={styles.summaryValue}>
                                        {getShippingFee() === 0 ? 'FREE' : `$${getShippingFee().toFixed(2)}`}
                                    </Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Tax</Text>
                                    <Text style={styles.summaryValue}>
                                        ${getTax().toFixed(2)}
                                    </Text>
                                </View>

                                <View style={[styles.summaryRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>
                                        ${getTotal().toFixed(2)}
                                    </Text>
                                </View>

                                {getShippingFee() === 0 && (
                                    <Text style={styles.freeShippingText}>
                                        🎉 You qualify for free shipping!
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Security Badge */}
                        <View style={styles.securitySection}>
                            <FontAwesome6 name="shield" size={16} color="#10b981" iconStyle='solid' />
                            <Text style={styles.securityText}>
                                Secure checkout • Your information is safe
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Checkout Button */}
            {cartItems.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.checkoutButton,
                            isCartLoading && styles.buttonDisabled
                        ]}
                        onPress={proceedToCheckout}
                        disabled={isCartLoading}
                    >
                        <View style={styles.checkoutInfo}>
                            <Text style={styles.checkoutText}>
                                {isCartLoading ? 'Processing...' : 'Proceed to Checkout'}
                            </Text>
                            <Text style={styles.checkoutTotal}>${getTotal().toFixed(2)}</Text>
                        </View>
                        {!isCartLoading && (
                            <FontAwesome6 name="arrow-right" size={16} color="#ffffff" iconStyle='solid' />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// Tambahkan RefreshControl import
import { RefreshControl } from 'react-native';

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
    header: {
        padding: 20,
        paddingTop: 20,
        backgroundColor: '#9bf89bff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    errorIndicator: {
        backgroundColor: '#ef4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    clearCartText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
    },
    errorBanner: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        gap: 8,
    },
    errorBannerText: {
        color: '#ffffff',
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
    },
    retryButtonSmall: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    pollingStatus: {
        backgroundColor: '#3fa34cff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    statusLabel: {
        fontSize: 12,
        color: '#e8f7e7ff',
        fontWeight: '500',
    },
    statusIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#d1fae5',
    },
    statusDisabled: {
        backgroundColor: '#fef3c7',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    statusValue: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    manualRefreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        padding: 8,
        borderRadius: 6,
        gap: 6,
        marginTop: 4,
    },
    manualRefreshText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#374151',
        marginTop: 24,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    shopButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    shopButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
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
    cartItemsSection: {
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    itemDetails: {
        flex: 1,
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
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#059669',
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 4,
        alignSelf: 'flex-start',
    },
    quantityButton: {
        width: 24,
        height: 24,
        borderRadius: 4,
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
        marginHorizontal: 12,
        minWidth: 20,
        textAlign: 'center',
    },
    itemActions: {
        alignItems: 'flex-end',
        gap: 8,
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    removeButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#fef2f2',
    },
    couponContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    couponInput: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    couponButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    couponButtonApplied: {
        backgroundColor: '#059669',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
        opacity: 0.6,
    },
    couponButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    summary: {
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
    discountText: {
        color: '#ef4444',
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
    freeShippingText: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
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
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    checkoutButton: {
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    checkoutInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkoutText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    checkoutTotal: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default CartScreen;