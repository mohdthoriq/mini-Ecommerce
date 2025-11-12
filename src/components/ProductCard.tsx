import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  cardWidth: number;
  isLandscape: boolean;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cardWidth,
  isLandscape,
  onPress,
}) => {
  const calculateDiscountedPrice = (price: number, discount?: number) => {
    if (!discount) return price;
    return price * (1 - discount / 100);
  };

  // Variasi background hijau berdasarkan kategori
  const getCardBackground = (category: string) => {
    const backgrounds: { [key: string]: string } = {
      electronics: '#f0f8f0', // Hijau sangat muda
      clothing: '#e8f5e9',    // Hijau muda
      food: '#f1f8e9',        // Hijau kekuningan
      automotive: '#e8f5e8',  // Hijau segar
      home: '#f0f7f0',        // Hijau soft
      beauty: '#e8f5ed',      // Hijau kebiruan
      sports: '#f0f8e8',      // Hijau cerah
      books: '#e8f5e6',       // Hijau natural
      default: '#f0f7f0'      // Default hijau
    };
    return backgrounds[category.toLowerCase()] || backgrounds.default;
  };

  const cardBackground = getCardBackground(product.category);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth,
          minHeight: isLandscape ? 200 : 180,
          backgroundColor: cardBackground,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header dengan gradient hijau */}
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {product.category}
          </Text>
        </View>
        
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

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Overlay hijau di image */}
        <View style={styles.imageOverlay} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        <View style={styles.priceContainer}>
          {product.discount ? (
            <>
              <Text style={styles.originalPrice}>
                ${product.price.toLocaleString()}
              </Text>
              <Text style={styles.discountedPrice}>
                ${calculateDiscountedPrice(product.price, product.discount).toLocaleString()}
              </Text>
            </>
          ) : (
            <Text style={styles.price}>
              ${product.price.toLocaleString()}
            </Text>
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        
        {/* Eco Features */}
        <View style={styles.ecoFeatures}>
          <View style={styles.ecoFeature}>
            <Text style={styles.ecoIcon}>🌿</Text>
            <Text style={styles.ecoText}>Eco</Text>
          </View>
          <View style={styles.ecoFeature}>
            <Text style={styles.ecoIcon}>💚</Text>
            <Text style={styles.ecoText}>Green</Text>
          </View>
          <View style={styles.ecoFeature}>
            <Text style={styles.ecoIcon}>🌎</Text>
            <Text style={styles.ecoText}>Earth</Text>
          </View>
        </View>
      </View>
      
      {/* Bottom accent hijau */}
      <View style={styles.bottomAccent} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#2e7d32',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e8f5e9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  newBadge: {
    backgroundColor: '#4caf50',
  },
  discountBadge: {
    backgroundColor: '#ff9800',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  content: {
    padding: 12,
    paddingTop: 0,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 6,
    lineHeight: 18,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  originalPrice: {
    fontSize: 14,
    color: '#78909c',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff5722',
  },
  description: {
    fontSize: 11,
    color: '#4caf50',
    lineHeight: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ecoFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  ecoFeature: {
    alignItems: 'center',
    flex: 1,
  },
  ecoIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  ecoText: {
    fontSize: 9,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  bottomAccent: {
    height: 4,
    width: '100%',
    backgroundColor: '#4caf50',
    opacity: 0.8,
  },
});

export default ProductCard;