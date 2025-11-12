import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NewProduct, ErrorsState } from '../types';

interface ProductFormProps {
  product: NewProduct;
  errors: ErrorsState;
  onChange: (field: keyof Omit<NewProduct, 'id'>, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  screenHeight: number;
  insets: any;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  errors,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  screenHeight,
  insets,
}) => {
  const handleSubmit = () => {
    if (isSubmitting) return;
    onSubmit();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <Text style={styles.headerSubtitle}>
          Fill in the details for your new eco-friendly product
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={[
                styles.input,
                errors.name && styles.inputError
              ]}
              value={product.name}
              onChangeText={(value) => onChange('name', value)}
              placeholder="Enter product name"
              placeholderTextColor="#999"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={[
                styles.input,
                errors.price && styles.inputError
              ]}
              value={product.price}
              onChangeText={(value) => onChange('price', value)}
              placeholder="Enter price"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            {errors.price && (
              <Text style={styles.errorText}>{errors.price}</Text>
            )}
          </View>

          {/* Image URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL *</Text>
            <TextInput
              style={[
                styles.input,
                errors.imageUrl && styles.inputError
              ]}
              value={product.imageUrl}
              onChangeText={(value) => onChange('imageUrl', value)}
              placeholder="Enter image URL"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            {errors.imageUrl && (
              <Text style={styles.errorText}>{errors.imageUrl}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[
                styles.textArea,
                errors.description && styles.inputError
              ]}
              value={product.description}
              onChangeText={(value) => onChange('description', value)}
              placeholder="Enter product description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Preview Section */}
          {product.imageUrl && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Image Preview</Text>
              <View style={styles.previewImageContainer}>
                <TextInput
                  style={styles.previewImage}
                  value={product.imageUrl}
                  editable={false}
                />
                <Text style={styles.previewText}>
                  {product.imageUrl ? 'Valid URL' : 'No image URL provided'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Adding...' : 'Add Product'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2e7d32',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e8f5e9',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff5722',
  },
  errorText: {
    fontSize: 14,
    color: '#ff5722',
    marginTop: 4,
  },
  previewSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 12,
  },
  previewImageContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  previewImage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#4caf50',
    marginTop: 8,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ProductForm;