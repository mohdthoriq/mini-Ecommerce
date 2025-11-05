import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const Header: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Mini Commerce</Text>
        <Text style={styles.subtitle}>Temukan produk terbaik untuk Anda</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FF4444', // Merah seperti Shopee
  },
  header: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default Header;