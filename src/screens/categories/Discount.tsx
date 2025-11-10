import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import ProductCard from '../../components/ProductCard';
import { initialProducts } from '../../data/initialProducts';

export default function Discount() {
  const isFocused = useIsFocused();
  const discountedProducts = initialProducts.filter(product => product.discount && product.discount > 0);
  const { width } = useWindowDimensions();
  const numColumns = 2;
  const cardWidth = (width - (16 * 2) - (12 * (numColumns - 1))) / numColumns;

  useEffect(() => {
    if (isFocused) {
      console.log('🔄 Tab Diskon: Konten dimuat');
      
      return () => {
        console.log('🧹 Tab Diskon: Konten dibersihkan');
      };
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎁 Produk Diskon</Text>
          <Text style={styles.subtitle}>
            {discountedProducts.length} produk dengan penawaran spesial
          </Text>
        </View>

        <FlatList
          data={discountedProducts}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard 
                product={item}
                cardWidth={cardWidth}
                isLandscape={false}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada produk diskon saat ini</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4caf50',
    opacity: 0.8,
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardWrapper: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#4caf50',
    opacity: 0.7,
  },
});