import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { initialProducts } from '../../data/initialProducts';
import ResetStackButton from '../../components/ResetStackButton';

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;

const ProductDetailScreen = () => {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const route = useRoute();

  const { productId } = route.params as { productId: string };

  const product = initialProducts.find(p => p.id === productId) || initialProducts[0];

  const handleBackToDrawerHome = () => {
    // Navigasi eksplisit ke parent drawer
    const parent = navigation.getParent();
    if (parent) {
      parent.goBack();
    }
  };

  const handleAddToCart = () => {
    Alert.alert(
      'Success',
      `${product.name} added to cart!`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleBuyNow = () => {
    navigation.navigate('CheckoutModal', { product });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.badgeContainer}>
          {product.isNew && (
            <View style={[styles.badge, styles.newBadge]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
          {product.discount && (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>{product.discount}% OFF</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toLocaleString()}</Text>
        
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Product Features:</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>•</Text>
            <Text style={styles.featureText}>Eco-friendly materials</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>•</Text>
            <Text style={styles.featureText}>Sustainable production</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>•</Text>
            <Text style={styles.featureText}>Free shipping available</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
            <Text style={styles.cartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={handleBackToDrawerHome}
          >
            <Text style={styles.navButtonText}>Kembali ke Drawer Home</Text>
          </TouchableOpacity>
          
          <ResetStackButton />
          
          <TouchableOpacity 
            style={styles.navButtonSecondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.navButtonSecondaryText}>Kembali ke Tabs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newBadge: {
    backgroundColor: '#4caf50',
  },
  discountBadge: {
    backgroundColor: '#ff5722',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  category: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
  },
  features: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureDot: {
    color: '#4caf50',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cartButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationButtons: {
    gap: 12,
  },
  navButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;