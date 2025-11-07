import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AddProductButtonProps } from '../types';

const AddProductButton: React.FC<AddProductButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>+ Tambah Produk Baru</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddProductButton;