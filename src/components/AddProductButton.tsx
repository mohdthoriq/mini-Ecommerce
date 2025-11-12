import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AddProductButtonProps {
  onPress: () => void;
  isLandscape: boolean;
}

const AddProductButton: React.FC<AddProductButtonProps> = ({ 
  onPress, 
  isLandscape 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isLandscape && styles.buttonLandscape
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonIcon}>+</Text>
      <Text style={styles.buttonText}>Add New Product</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonLandscape: {
    paddingHorizontal: 32,
  },
  buttonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AddProductButton;