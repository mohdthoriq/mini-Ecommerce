import React from "react"
import { StyleSheet, Text, View } from "react-native"

const Header: React.FC = () => {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>Mini E-Commerce</Text>
            <Text style={styles.subtitle}>Temukan Produk terbaik untuk anda</Text>
        </View>
    )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2E86DE',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default Header;

