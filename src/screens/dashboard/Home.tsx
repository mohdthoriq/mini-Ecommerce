import { useNavigation } from "@react-navigation/native";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export default function Home() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>🌿 EcoTech Fashion</Text>
                        <Text style={styles.subtitle}>Sustainable Electronics & Apparel</Text>
                    </View>

                    {/* Main Content */}
                    <View style={styles.content}>
                        {/* Welcome Banner */}
                        <View style={styles.welcomeBanner}>
                            <Text style={styles.welcomeTitle}>Tech Meets Sustainability</Text>
                            <Text style={styles.welcomeText}>
                                Discover eco-friendly electronics and sustainable fashion that don't compromise on style or performance
                            </Text>
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>89</Text>
                                <Text style={styles.statLabel}>Products</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>42</Text>
                                <Text style={styles.statLabel}>Electronics</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>47</Text>
                                <Text style={styles.statLabel}>Fashion</Text>
                            </View>
                        </View>

                        {/* Product Categories */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Shop Categories</Text>
                            <View style={styles.categoriesContainer}>
                                <TouchableOpacity style={styles.categoryCard}>
                                    <Text style={styles.categoryIcon}>📱</Text>
                                    <Text style={styles.categoryName}>Smartphones</Text>
                                    <Text style={styles.categoryCount}>15 items</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.categoryCard}>
                                    <Text style={styles.categoryIcon}>💻</Text>
                                    <Text style={styles.categoryName}>Laptops</Text>
                                    <Text style={styles.categoryCount}>12 items</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.categoryCard}>
                                    <Text style={styles.categoryIcon}>👕</Text>
                                    <Text style={styles.categoryName}>T-Shirts</Text>
                                    <Text style={styles.categoryCount}>18 items</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.categoryCard}>
                                    <Text style={styles.categoryIcon}>👖</Text>
                                    <Text style={styles.categoryName}>Jeans</Text>
                                    <Text style={styles.categoryCount}>14 items</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.categoryCard}>
                                    <Text style={styles.categoryIcon}>🎧</Text>
                                    <Text style={styles.categoryName}>Accessories</Text>
                                    <Text style={styles.categoryCount}>20 items</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.categoryCard}>
                                    <Text style={styles.categoryIcon}>🔋</Text>
                                    <Text style={styles.categoryName}>Power Banks</Text>
                                    <Text style={styles.categoryCount}>10 items</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Eco Features */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Our Eco Commitment</Text>
                            <View style={styles.featuresContainer}>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>🔄</Text>
                                    <Text style={styles.featureTitle}>Refurbished</Text>
                                    <Text style={styles.featureDesc}>Certified pre-owned devices</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>🌿</Text>
                                    <Text style={styles.featureTitle}>Organic</Text>
                                    <Text style={styles.featureDesc}>100% organic cotton</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>♻️</Text>
                                    <Text style={styles.featureTitle}>Recycled</Text>
                                    <Text style={styles.featureDesc}>Recycled materials used</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Text style={styles.featureIcon}>💚</Text>
                                    <Text style={styles.featureTitle}>Ethical</Text>
                                    <Text style={styles.featureDesc}>Fair labor practices</Text>
                                </View>
                            </View>
                        </View>

                        {/* Featured Products */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Featured Products</Text>
                            <View style={styles.featuredProducts}>
                                <View style={styles.featuredProductCard}>
                                    <View style={styles.productImagePlaceholder}>
                                        <Text style={styles.productIcon}>📱</Text>
                                    </View>
                                    <Text style={styles.productName}>EcoPhone X</Text>
                                    <Text style={styles.productDesc}>Refurbished smartphone</Text>
                                    <Text style={styles.productPrice}>$299</Text>
                                </View>
                                <View style={styles.featuredProductCard}>
                                    <View style={styles.productImagePlaceholder}>
                                        <Text style={styles.productIcon}>👕</Text>
                                    </View>
                                    <Text style={styles.productName}>Organic Tee</Text>
                                    <Text style={styles.productDesc}>100% cotton t-shirt</Text>
                                    <Text style={styles.productPrice}>$24</Text>
                                </View>
                                <View style={styles.featuredProductCard}>
                                    <View style={styles.productImagePlaceholder}>
                                        <Text style={styles.productIcon}>💻</Text>
                                    </View>
                                    <Text style={styles.productName}>GreenBook Pro</Text>
                                    <Text style={styles.productDesc}>Eco-friendly laptop</Text>
                                    <Text style={styles.productPrice}>$899</Text>
                                </View>
                            </View>
                        </View>

                        {/* Special Offers */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Special Offers</Text>
                            <View style={styles.offerCard}>
                                <View style={styles.offerBadge}>
                                    <Text style={styles.offerBadgeText}>15% OFF</Text>
                                </View>
                                <Text style={styles.offerTitle}>Back to School Bundle</Text>
                                <Text style={styles.offerDescription}>
                                    Get a refurbished laptop + organic cotton backpack + solar power bank
                                </Text>
                                <Text style={styles.offerValid}>Limited time offer</Text>
                            </View>
                        </View>

                        {/* Why Choose Us */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Why Shop With Us?</Text>
                            <View style={styles.benefitsContainer}>
                                <View style={styles.benefitItem}>
                                    <Text style={styles.benefitIcon}>🚚</Text>
                                    <Text style={styles.benefitTitle}>Free Shipping</Text>
                                    <Text style={styles.benefitDesc}>On orders over $50</Text>
                                </View>
                                <View style={styles.benefitItem}>
                                    <Text style={styles.benefitIcon}>🔧</Text>
                                    <Text style={styles.benefitTitle}>1 Year Warranty</Text>
                                    <Text style={styles.benefitDesc}>On all electronics</Text>
                                </View>
                                <View style={styles.benefitItem}>
                                    <Text style={styles.benefitIcon}>💳</Text>
                                    <Text style={styles.benefitTitle}>Easy Returns</Text>
                                    <Text style={styles.benefitDesc}>30-day return policy</Text>
                                </View>
                                <View style={styles.benefitItem}>
                                    <Text style={styles.benefitIcon}>🌍</Text>
                                    <Text style={styles.benefitTitle}>Carbon Neutral</Text>
                                    <Text style={styles.benefitDesc}>We offset emissions</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Navigation Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('ProductList')}
                        >
                            <Text style={styles.primaryButtonText}>Browse All Products</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Text style={styles.secondaryButtonText}>My Account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>EcoTech Fashion - Sustainable Tech & Apparel 🌱</Text>
                        <Text style={styles.footerSubtext}>Better choices for a better planet</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f7f0',
    },
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#f0f7f0',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#d4e8d4',
        marginBottom: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#4caf50',
        opacity: 0.8,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    welcomeBanner: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 25,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderLeftWidth: 4,
        borderLeftColor: '#4caf50',
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 14,
        color: '#388e3c',
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statItem: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        flex: 1,
        marginHorizontal: 5,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
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
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 15,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        width: '48%',
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2e7d32',
        marginBottom: 4,
        textAlign: 'center',
    },
    categoryCount: {
        fontSize: 11,
        color: '#4caf50',
        opacity: 0.8,
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureItem: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        width: '48%',
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    featureIcon: {
        fontSize: 20,
        marginBottom: 8,
    },
    featureTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 4,
        textAlign: 'center',
    },
    featureDesc: {
        fontSize: 10,
        color: '#4caf50',
        textAlign: 'center',
        lineHeight: 14,
    },
    featuredProducts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    featuredProductCard: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        width: '31%',
        alignItems: 'center',
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    productImagePlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#e8f5e8',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    productIcon: {
        fontSize: 20,
    },
    productName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2e7d32',
        textAlign: 'center',
        marginBottom: 4,
    },
    productDesc: {
        fontSize: 10,
        color: '#4caf50',
        textAlign: 'center',
        marginBottom: 6,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    offerCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#4caf50',
        position: 'relative',
    },
    offerBadge: {
        position: 'absolute',
        top: -10,
        right: 15,
        backgroundColor: '#4caf50',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    offerBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    offerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 8,
    },
    offerDescription: {
        fontSize: 14,
        color: '#388e3c',
        lineHeight: 20,
        marginBottom: 8,
    },
    offerValid: {
        fontSize: 12,
        color: '#4caf50',
        opacity: 0.7,
    },
    benefitsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    benefitItem: {
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 12,
        width: '48%',
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#2e7d32',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    benefitIcon: {
        fontSize: 20,
        marginBottom: 8,
    },
    benefitTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 4,
        textAlign: 'center',
    },
    benefitDesc: {
        fontSize: 10,
        color: '#4caf50',
        textAlign: 'center',
        lineHeight: 14,
    },
    buttonContainer: {
        paddingBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#4caf50',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#4caf50',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 7,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4caf50',
        marginBottom: 12,
    },
    secondaryButtonText: {
        color: '#4caf50',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 25,
        borderTopWidth: 1,
        borderTopColor: '#d4e8d4',
        marginTop: 10,
    },
    footerText: {
        fontSize: 14,
        color: '#4caf50',
        fontWeight: '600',
        marginBottom: 5,
        textAlign: 'center',
    },
    footerSubtext: {
        fontSize: 12,
        color: '#4caf50',
        opacity: 0.6,
        textAlign: 'center',
    },
});