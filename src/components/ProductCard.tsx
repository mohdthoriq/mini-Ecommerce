import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { ProductCardProps } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards per row dengan spacing

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <View style={styles.card}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
        {/* Discount Badge (optional) */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>15%</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>Rp {product.price.toLocaleString('id-ID')}</Text>
          {/* Original Price (optional) */}
          <Text style={styles.originalPrice}>Rp {(product.price * 1.15).toLocaleString('id-ID')}</Text>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingContainer}>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>⭐ 4.8</Text>
            <Text style={styles.soldText}>(128 terjual)</Text>
          </View>
        </View>

        {/* Free Shipping Badge */}
        <View style={styles.shippingBadge}>
          <Text style={styles.shippingText}>🚚 Gratis Ongkir</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: CARD_WIDTH,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#F8F9FA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 13,
    color: '#2D2D2D',
    marginBottom: 6,
    lineHeight: 16,
    fontWeight: '400',
    height: 32, // Fixed height for 2 lines
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    marginBottom: 6,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingText: {
    fontSize: 10,
    color: '#666666',
    marginRight: 4,
  },
  soldText: {
    fontSize: 10,
    color: '#666666',
  },
  shippingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shippingText: {
    fontSize: 9,
    color: '#00A650',
    fontWeight: '500',
  },
});

export default ProductCard;