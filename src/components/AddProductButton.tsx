import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { AddProductButtonProps } from '../types';

const AddProductButton: React.FC<AddProductButtonProps> = ({ onPress, isLandscape }) => {
  return (
    <View style={[
      styles.container,
      isLandscape && styles.landscapeContainer
    ]}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>+ Tambah Produk Baru</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  landscapeContainer: {
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#2e7d32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default AddProductButton;