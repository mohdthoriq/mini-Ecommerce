import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Product } from '../types';
import Icon from "@react-native-vector-icons/fontawesome6";

interface ProductCardProps {
  product: Product;
  cardWidth: number;
  isLandscape: boolean;
  onPress?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  cardWidth, 
  isLandscape,
  onPress 
}) => {
  const handleProductPress = () => {
    if (onPress) {
      onPress(product);
    } else {
      Alert.alert(
        product.name,
        `Harga: Rp ${product.price.toLocaleString('id-ID')}\n\n${product.description}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddToCart = () => {
    Alert.alert(
      'Berhasil!',
      `${product.name} ditambahkan ke keranjang`,
      [{ text: 'OK' }]
    );
  };

  const handleAddToWishlist = () => {
    Alert.alert(
      'Berhasil!',
      `${product.name} ditambahkan ke wishlist`,
      [{ text: 'OK' }]
    );
  };

  
  const formatPrice = (price: number) => {
    return price.toLocaleString('id-ID');
  };

  
  const calculateDiscountedPrice = () => {
    if (product.discount && product.discount > 0) {
      return product.price * (1 - product.discount / 100);
    }
    return null;
  };

  const discountedPrice = calculateDiscountedPrice();

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        { width: cardWidth },
        isLandscape && styles.landscapeCard
      ]}
      onPress={handleProductPress}
      activeOpacity={0.7}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        {/* Badges Container */}
        <View style={styles.badgesContainer}>
          {/* Discount Badge */}
          {product.discount && product.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {product.discount}%
              </Text>
            </View>
          )}
          
          {/* Popular Badge */}
          {product.isPopular && (
            <View style={styles.popularBadge}>
              <Icon name="fire" size={8} color="#ffffff" iconStyle='solid' />
            </View>
          )}
          
          {/* New Badge */}
          {product.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Wishlist Button */}
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={handleAddToWishlist}
        >
          <Icon name="heart" size={14} color="#ff6b6b" />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Product Description */}
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description}
        </Text>

        {/* Price Section */}
        <View style={styles.priceSection}>
          {discountedPrice ? (
            <>
              <View style={styles.discountPriceContainer}>
                <Text style={styles.originalPrice}>
                  Rp {formatPrice(product.price)}
                </Text>
                <Text style={styles.discountedPrice}>
                  Rp {formatPrice(discountedPrice)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.normalPrice}>
              Rp {formatPrice(product.price)}
            </Text>
          )}
        </View>

        {/* Category Tag */}
        {product.category && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>
              {getCategoryIcon(product.category)}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={handleAddToCart}
          >
            <Icon name="cart-shopping" size={12} color="#ffffff" iconStyle='solid' />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Helper function untuk mendapatkan ikon kategori
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'electronics':
      return '📱';
    case 'clothing':
      return <Text>👕</Text>;
    case 'food':
      return <Text>🍎</Text>;
    case 'automotive':
      return <Text>🚗</Text>;
    case 'entertainment':
      return <Text>🎮</Text>;
    case 'baby':
      return <Text>👶</Text>;
    case 'personal-care':
      return <Text>🧴</Text>;;
    case 'lifestyle':
      return <Text>🌿‍</Text>;
    case 'kitchen':
      return <Text>🔪</Text>;
    default:
      return <Text>🛍️</Text>;

  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#2e7d32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8f5e8',
    overflow: 'hidden',
  },
  landscapeCard: {
    // Tetap 2 columns meskipun landscape
  },
  imageContainer: {
    position: 'relative',
    height: 140, 
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badgesContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  discountBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularBadge: {
    backgroundColor: '#ffa726',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  wishlistButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    padding: 10, // 🔥 PADDING LEBIH KECIL
  },
  productName: {
    fontSize: 12, // 🔥 FONT LEBIH KECIL
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
    lineHeight: 14,
    height: 28, // 🔥 FIXED HEIGHT UNTUK 2 BARIS
  },
  productDescription: {
    fontSize: 10, // 🔥 FONT LEBIH KECIL
    color: '#4caf50',
    marginBottom: 6,
    lineHeight: 12,
    height: 24, // 🔥 FIXED HEIGHT UNTUK 2 BARIS
    opacity: 0.8,
  },
  priceSection: {
    marginBottom: 6,
  },
  discountPriceContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  originalPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  normalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  categoryTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#f0f7f0',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cartButton: {
    backgroundColor: '#4caf50',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4caf50',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default ProductCard;