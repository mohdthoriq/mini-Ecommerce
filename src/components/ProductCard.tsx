import React from "react";
import { ProductCardProps } from "../types";
import { Image, StyleSheet, Text, View } from "react-native";

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <>
            <View style={styles.card}>
                <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.image}
                    resizeMode='cover'
                    />
                <View style={styles.content}>
                    <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</Text>
                    <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
                </View>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 6,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3A47',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86DE',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: '#636E72',
    lineHeight: 16,
  },
});

export default ProductCard;