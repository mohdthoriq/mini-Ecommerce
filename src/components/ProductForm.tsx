import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ProductFormProps } from '../types';

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  errors,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Check image URL when imageUrl changes
  useEffect(() => {
    if (product.imageUrl.trim()) {
      checkImageUrl(product.imageUrl);
    } else {
      setImagePreview(null);
      setImageError(null);
    }
  }, [product.imageUrl]);

  const checkImageUrl = async (url: string) => {
    if (!isValidUrl(url)) {
      setImageError('Format URL tidak valid');
      setImagePreview(null);
      return;
    }

    setIsLoadingImage(true);
    setImageError(null);

    try {
      await Image.getSize(url, () => setImagePreview(url), () => { throw new Error() });
    } catch (error) {
      setImageError('Gambar tidak dapat dimuat dari URL ini');
      setImagePreview(null);
    } finally {
      setIsLoadingImage(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleImageUrlChange = (text: string) => {
    onChange('imageUrl', text);
  };

  const handleSubmitWithValidation = () => {
    if (imageError) {
      Alert.alert(
        'URL Gambar Tidak Valid',
        'Silakan periksa kembali URL gambar Anda',
        [{ text: 'OK' }]
      );
      return;
    }

    if (product.imageUrl.trim() && !imagePreview) {
      Alert.alert(
        'Gambar Tidak Dapat Dimuat',
        'URL gambar tidak dapat diakses. Silakan gunakan URL yang berbeda.',
        [{ text: 'OK' }]
      );
      return;
    }

    onSubmit();
  };

  return (
    <View style={styles.modalContainer}>
      {/* Header Modal */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Tambah Produk Baru</Text>
        <Text style={styles.modalSubtitle}>Isi form berikut untuk menambah produk</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Preview Section */}
          {(imagePreview || isLoadingImage || imageError) && (
            <View style={styles.imagePreviewSection}>
              <Text style={styles.previewLabel}>Preview Gambar:</Text>
              <View style={styles.imagePreviewContainer}>
                {isLoadingImage ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2E86DE" />
                    <Text style={styles.loadingText}>Memuat gambar...</Text>
                  </View>
                ) : imagePreview ? (
                  <Image 
                    source={{ uri: imagePreview }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                ) : imageError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>❌ {imageError}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Nama Produk */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Produk *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Masukkan nama produk"
              placeholderTextColor="#999"
              value={product.name}
              onChangeText={(text) => onChange('name', text)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Harga */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Harga *</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>Rp</Text>
              <TextInput
                style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
                placeholder="1000000"
                placeholderTextColor="#999"
                value={product.price}
                onChangeText={(text) => onChange('price', text)}
                keyboardType="numeric"
              />
            </View>
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          {/* URL Gambar */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>URL Gambar *</Text>
            <TextInput
              style={[styles.input, errors.imageUrl && styles.inputError]}
              placeholder="https://example.com/gambar.jpg"
              placeholderTextColor="#999"
              value={product.imageUrl}
              onChangeText={handleImageUrlChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Contoh: https://images.unsplash.com/photo-1546069901-ba9599a7e63c
            </Text>
            {errors.imageUrl && <Text style={styles.errorText}>{errors.imageUrl}</Text>}
          </View>

          {/* Deskripsi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deskripsi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Masukkan deskripsi produk (opsional)"
              placeholderTextColor="#999"
              value={product.description}
              onChangeText={(text) => onChange('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Tips URL Gambar */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips URL Gambar:</Text>
            <Text style={styles.tipsText}>
              • Gunakan Unsplash: https://images.unsplash.com/...
            </Text>
            <Text style={styles.tipsText}>
              • Pastikan URL berakhiran .jpg, .png, atau .webp
            </Text>
            <Text style={styles.tipsText}>
              • Hindari URL yang membutuhkan login/autentikasi
            </Text>
          </View>

          {/* Button Group */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.submitButton, 
                (isSubmitting || imageError) && styles.disabledButton
              ]} 
              onPress={handleSubmitWithValidation}
              disabled={isSubmitting || !!imageError}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Menambahkan...' : 'Tambah Produk'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    backgroundColor: '#2E86DE',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1B6FC6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  imagePreviewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3A47',
    marginBottom: 8,
  },
  imagePreviewContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderStyle: 'dashed',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3A47',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#2C3A47',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3A47',
    marginRight: 8,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  priceInput: {
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FDEDED',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tipsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  submitButton: {
    backgroundColor: '#2E86DE',
  },
  disabledButton: {
    backgroundColor: '#B2BEC3',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductForm;