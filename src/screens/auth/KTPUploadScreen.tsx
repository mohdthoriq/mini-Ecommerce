import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { KTPUploadScreen } from '../../components/KTPUploadScreen';
import { KTPPhoto } from '../../hooks/useKTPCamera';
import { useImagePicker } from '../../utils/imagePicker';
import { requestStoragePermissionAndSave } from '../../utils/cameraPermissions';

const KTPUploadScreenPage: React.FC = () => {
  const { openGallery } = useImagePicker();
  const [upload, setUpload] = useState(false);
  const [ktpPhoto, setKtpPhoto] = useState<KTPPhoto | null>(null);

  const handlePhotoTaken = (photo: KTPPhoto) => {
    console.log('KTP Photo taken:', photo);
    setKtpPhoto(photo);
    Alert.alert(
      'Berhasil',
      'Foto KTP telah berhasil diambil dan disimpan.',
      [{ text: 'OK' }]
    );
  };

  const handlePhotoRemoved = () => {
    console.log('KTP Photo removed');
    setKtpPhoto(null);
    Alert.alert(
      'Berhasil',
      'Foto KTP telah dihapus.',
      [{ text: 'OK' }]
    );
  };

  const handleUploadFromGallery = async () => {
    setUpload(true);

    try {
      const result = await openGallery();

      if (!result || result.length === 0) {
        console.log('Gallery cancelled');
        return;
      }

      const asset = result[0];

      const photo = {
        uri: asset.uri!,
        type: asset.type ?? 'image/jpeg',
        fileName: asset.fileName ?? 'gallery_photo.jpg',
      };

      console.log('Gallery photo:', photo);

      // Simulasikan upload
      const form = new FormData();
      form.append('file', {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName,
      } as any);

      const uploadResponse = await fetch('https://api.example.com/upload', {
        method: 'POST',
        body: form,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload result:', await uploadResponse.json());
      Alert.alert('Sukses', 'Foto dari galeri berhasil diupload');

    } catch (error) {
      console.error('Upload gallery error:', error);
      Alert.alert('Error', 'Gagal upload foto dari galeri');
    } finally {
      setUpload(false);
    }
  };

  // ✅ FUNGSI dengan error handling yang lebih robust
  const handleTakeKTPWithBackup = async () => {
    setUpload(true);
    try {
      const asset = await requestStoragePermissionAndSave();
      
      if (asset) {
        const ktpPhotoData: KTPPhoto = {
          uri: asset.uri!,
          fileName: asset.fileName || `ktp_${Date.now()}.jpg`,
          timestamp: new Date().toISOString(),
          savedToGallery: true
        };
        
        handlePhotoTaken(ktpPhotoData);
      } else {
        console.log('No asset returned from camera');
      }
    } catch (error) {
      console.error('Error taking KTP photo:', error);
      Alert.alert(
        'Error', 
        'Gagal mengambil foto KTP. Silakan coba lagi atau gunakan galeri.',
        [
          {
            text: 'Buka Galeri',
            onPress: handleUploadFromGallery
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setUpload(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verifikasi Identitas</Text>
        <Text style={styles.headerSubtitle}>
          Silakan ambil foto KTP Anda untuk proses verifikasi
        </Text>
      </View>

      <View style={styles.content}>
        <KTPUploadScreen
          onPhotoTaken={handlePhotoTaken}
          onPhotoRemoved={handlePhotoRemoved}
          title="Foto KTP Anda"
          description="Pastikan foto KTP jelas dan semua informasi terbaca"
        />

        <View style={styles.alternativeSection}>
          <Text style={styles.alternativeTitle}>Atau</Text>
          
          <TouchableOpacity
            style={[styles.alternativeButton, upload && styles.buttonDisabled]}
            onPress={handleUploadFromGallery}
            disabled={upload}
          >
            {upload ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.alternativeButtonText}>
                Pilih dari Gallery
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, upload && styles.buttonDisabled]}
            onPress={handleTakeKTPWithBackup}
            disabled={upload}
          >
            {upload ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.backupButtonText}>
                📸 Ambil Foto KTP (Dengan Backup)
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {ktpPhoto && (
          <View style={styles.photoStatus}>
            <Text style={styles.statusTitle}>Status Foto KTP:</Text>
            <Text style={styles.statusText}>📁 {ktpPhoto.fileName}</Text>
            <Text style={styles.statusText}>⏰ {new Date(ktpPhoto.timestamp).toLocaleString()}</Text>
            <Text style={styles.statusText}>
              {ktpPhoto.savedToGallery ? '✅ Tersimpan di Gallery' : '📱 Hanya di Aplikasi'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data KTP Anda akan disimpan dengan aman dan hanya digunakan untuk proses verifikasi.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  alternativeSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  alternativeTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  alternativeButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  backupButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  alternativeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoStatus: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default KTPUploadScreenPage;