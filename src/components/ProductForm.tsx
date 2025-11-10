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
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { ProductFormProps } from '../types';

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  errors,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  screenHeight,
  insets = { top: 0, bottom: 0, left: 0, right: 0 },
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // 🔥 HOOK RESPONSIVE
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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
    <View style={[
      styles.modalContainer,
      { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    ]}>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#2e7d32"
        translucent={true}
      />
      {/* Header Modal */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>🌱 Tambah Produk Baru</Text>
        <Text style={styles.modalSubtitle}>Lengkapi data produk sustainable Anda</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && styles.landscapeScrollContent
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Preview Section */}
          {(product.imageUrl.trim() || imagePreview || isLoadingImage || imageError) && (
            <View style={styles.imagePreviewSection}>
              <Text style={styles.previewLabel}>Preview Gambar</Text>
              <View style={styles.imagePreviewContainer}>
                {isLoadingImage ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4caf50" />
                    <Text style={styles.loadingText}>Memuat gambar...</Text>
                  </View>
                ) : imagePreview ? (
                  <View style={styles.imageSuccess}>
                    <Image 
                      source={{ uri: imagePreview }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.successBadge}>
                      <Text style={styles.successText}>✓ Gambar Valid</Text>
                    </View>
                  </View>
                ) : imageError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{imageError}</Text>
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>Masukkan URL untuk preview</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Nama Produk */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Produk *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Contoh: EcoPhone X Refurbished"
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
                <View style={styles.currencySymbol}>
                  <Text style={styles.currencyText}>Rp</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.priceInput, errors.price && styles.inputError]}
                  placeholder="15000000"
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
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor="#999"
                value={product.imageUrl}
                onChangeText={handleImageUrlChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                Paste URL gambar dari Unsplash atau sumber lainnya
              </Text>
              {errors.imageUrl && <Text style={styles.errorText}>{errors.imageUrl}</Text>}
            </View>

            {/* Deskripsi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deskripsi Produk</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Deskripsikan keunggulan eco-friendly produk Anda..."
                placeholderTextColor="#999"
                value={product.description}
                onChangeText={(text) => onChange('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Tips URL Gambar */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips URL Gambar yang Baik:</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipsText}>• Gunakan gambar dari Unsplash.com</Text>
              <Text style={styles.tipsText}>• Pastikan URL berakhiran .jpg, .png, atau .webp</Text>
              <Text style={styles.tipsText}>• Hindari URL yang membutuhkan login</Text>
              <Text style={styles.tipsText}>• Ukuran gambar disarankan 400x400 pixel</Text>
            </View>
          </View>

          {/* Button Group */}
          <View style={[
            styles.buttonGroup,
            isLandscape && styles.landscapeButtonGroup
          ]}>
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
    backgroundColor: '#f0f7f0',
  },
  modalHeader: {
    backgroundColor: '#2e7d32',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8d4',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#e8f5e8',
    textAlign: 'center',
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
    padding: 16,
  },
  landscapeScrollContent: {
    paddingHorizontal: 24,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  imagePreviewSection: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  imagePreviewContainer: {
    borderWidth: 2,
    borderColor: '#d4e8d4',
    borderRadius: 12,
    borderStyle: 'dashed',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fdf8',
    overflow: 'hidden',
  },
  imageSuccess: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  successBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  successText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    color: '#4caf50',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4e8d4',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#2e7d32',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  priceInput: {
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#fff5f5',
  },
  helperText: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 6,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  tipsContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  tipsList: {
    gap: 4,
  },
  tipsText: {
    fontSize: 14,
    color: '#388e3c',
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  landscapeButtonGroup: {
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  submitButton: {
    backgroundColor: '#4caf50',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductForm;