import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AddProductButtonProps } from '../types';

const AddProductButton: React.FC<AddProductButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>Tambah Produk</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2E86DE',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginHorizontal: 16,
    marginVertical: 16,
    shadowColor: '#2E86DE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddProductButton;