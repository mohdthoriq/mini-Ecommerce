import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';

export const useImagePicker = () => {
  const [isLoading, setIsLoading] = useState(false);

  const openCamera = async (): Promise<Asset[] | null> => {
    setIsLoading(true);
    try {
      // ✅ TAMBAHKAN DELAY UNTUK FEEDBACK VISUAL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.7,
      });

      if (!result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets;
    } catch (err) {
      console.log('Camera error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openGallery = async (): Promise<Asset[] | null> => {
    setIsLoading(true);
    try {
      // ✅ TAMBAHKAN DELAY UNTUK FEEDBACK VISUAL
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      });

      if (!result.assets || result.assets.length === 0) {
        return null;
      }

      return result.assets;
    } catch (err) {
      console.log('Gallery error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FUNGSI BARU: Ambil gambar dengan Base64 untuk preview cepat
  const openGalleryWithPreview = async (): Promise<{
    assets: Asset[] | null;
    base64Preview: string | null;
  }> => {
    setIsLoading(true);
    try {
      // ✅ TAMBAHKAN DELAY LEBIH LAMA UNTUK PROSES BASE64
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: true, // ✅ Generate Base64
        maxWidth: 300,       // ✅ Ukuran kecil untuk preview
        maxHeight: 300,      // ✅ Ukuran kecil untuk preview
        quality: 0.5,        // ✅ Kualitas lebih rendah untuk preview
      });

      if (!result.assets || result.assets.length === 0) {
        return { assets: null, base64Preview: null };
      }

      const asset = result.assets[0];
      let base64Preview = null;

      // ✅ SIMPAN BASE64 DENGAN LOADING FEEDBACK
      if (asset.base64) {
        base64Preview = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
        
        try {
          // ✅ TAMBAHKAN DELAY UNTUK SIMULASI PROSES PENYIMPANAN
          await new Promise(resolve => setTimeout(resolve, 300));
          await AsyncStorage.setItem('@user:profile_preview', base64Preview);
          console.log('✅ Base64 preview saved to AsyncStorage');
        } catch (storageError) {
          console.error('❌ Failed to save base64 preview:', storageError);
        }
      }

      return {
        assets: result.assets,
        base64Preview: base64Preview
      };

    } catch (err) {
      console.log('Gallery with preview error:', err);
      return { assets: null, base64Preview: null };
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FUNGSI BARU: Ambil preview dari AsyncStorage
  const getCachedPreview = async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      // ✅ TAMBAHKAN DELAY KECIL UNTUK FEEDBACK
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const base64Preview = await AsyncStorage.getItem('@user:profile_preview');
      return base64Preview;
    } catch (error) {
      console.error('❌ Error getting cached preview:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FUNGSI BARU: Hapus preview cache
  const clearCachedPreview = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // ✅ TAMBAHKAN DELAY UNTUK FEEDBACK
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await AsyncStorage.removeItem('@user:profile_preview');
      console.log('✅ Cached preview cleared');
    } catch (error) {
      console.error('❌ Error clearing cached preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    openCamera, 
    openGallery,
    openGalleryWithPreview,
    getCachedPreview,
    clearCachedPreview,
    isLoading  // ✅ EXPORT LOADING STATE
  };
};