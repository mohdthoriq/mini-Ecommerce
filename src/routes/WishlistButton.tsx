import React from 'react';
import { TouchableOpacity, StyleSheet, View, Alert, GestureResponderEvent } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useWishlist } from '../services/wishlist/useWishlist';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

interface WishlistButtonProps {
  product: Product;
  size?: number;
  style?: object;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ product, size = 24, style }) => {
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleItem:toggleWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product.id);

  const handlePress = (e: GestureResponderEvent) => {
    e.stopPropagation(); // ✅ Hentikan event agar tidak menyebar ke parent (kartu produk)
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'You need to be logged in to add items to your wishlist.');
      return;
    }
    toggleWishlist(product.id);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.button, style]}>
      <FontAwesome6
        name={isWishlisted ? "heart" : "heart"}
        size={size}
        color={isWishlisted ? '#ef4444' : '#666'}
        iconStyle='solid' // Gunakan ikon solid jika di-wishlist
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    // Shadow untuk iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // Elevation untuk Android
    elevation: 2,
  },
});

export default WishlistButton;