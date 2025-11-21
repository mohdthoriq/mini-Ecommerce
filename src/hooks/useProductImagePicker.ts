import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { Alert } from 'react-native';

export const useProductImagePicker = () => {
  
  const pickProductImages = async (): Promise<Asset[] | null> => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 5,       // max 5 foto
        maxWidth: 600,           // preview resize
        maxHeight: 600,
        quality: 0.8,
      });

      if (!result.assets || result.assets.length === 0) {
        console.log('Gallery canceled bro');
        return null;
      }

      // ambil data yang dibutuhkan
      const simplified = result.assets.map(a => ({
        uri: a.uri,
        fileName: a.fileName,
      }));

      // simpen ke storage
      await AsyncStorage.setItem('@ecom:newProductAssets', JSON.stringify(simplified));

      Alert.alert('Success', `${simplified.length} foto berhasil dipilih`);
      return result.assets;

    } catch (err) {
      console.log('Gallery error:', err);
      Alert.alert('Error', 'Gagal buka gallery');
      return null;
    }
  };

  return { pickProductImages };
};
