import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import ProductCard from '../../components/ProductCard';
import { initialProducts } from '../../data/initialProducts';

export default function Popular() {
  const popularProducts = initialProducts.filter(product => product.isPopular);
  
  // 🔥 TAMBAHKAN HOOK UNTUK RESPONSIVE LAYOUT
  const { width } = useWindowDimensions();
  const numColumns = 2;
  const cardWidth = (width - (16 * 2) - (12 * (numColumns - 1))) / numColumns;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔥 Produk Populer</Text>
          <Text style={styles.subtitle}>
            {popularProducts.length} produk paling diminati
          </Text>
        </View>

        {/* 🔥 PERBAIKAN: FLATLIST DENGAN GRID 2 KOLOM */}
        <FlatList
          data={popularProducts}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard 
                product={item}
                cardWidth={cardWidth} // 🔥 GUNAKAN cardWidth YANG DIHITUNG
                isLandscape={false}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          numColumns={numColumns} // 🔥 SET 2 KOLOM
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada produk populer</Text>
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
    paddingHorizontal: 16, // 🔥 PADDING HORIZONTAL SAJA
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
    justifyContent: 'space-between', // 🔥 RATA KIRI-KANAN
    marginBottom: 12, // 🔥 SPACING ANTAR ROW
  },
  cardWrapper: {
    // 🔥 WRAPPER UNTUK CONSISTENT SPACING
  },
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