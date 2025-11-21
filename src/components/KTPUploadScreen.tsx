import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  Image, 
  ActivityIndicator,
  StyleSheet,
  Alert 
} from 'react-native';
import { useKTPCamera, KTPPhoto } from '../hooks/useKTPCamera';

interface KTPUploadScreenProps {
  onPhotoTaken?: (photo: KTPPhoto) => void;
  onPhotoRemoved?: () => void;
  title?: string;
  description?: string;
}

export const KTPUploadScreen: React.FC<KTPUploadScreenProps> = ({
  onPhotoTaken,
  onPhotoRemoved,
  title = 'Foto KTP',
  description = 'Ambil foto KTP untuk verifikasi identitas'
}) => {
  const { ktpPhoto, isLoading, takeKTPPhoto, clearKTPPhoto } = useKTPCamera();

  const handleTakePhoto = async () => {
    try {
      await takeKTPPhoto();
      if (ktpPhoto && onPhotoTaken) {
        onPhotoTaken(ktpPhoto);
      }
    } catch (error) {
      console.error('Error taking KTP photo:', error);
    }
  };

  const handleClearPhoto = async () => {
    Alert.alert(
      'Hapus Foto KTP',
      'Apakah Anda yakin ingin menghapus foto KTP?',
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await clearKTPPhoto();
            if (onPhotoRemoved) {
              onPhotoRemoved();
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <TouchableOpacity
        style={[
          styles.button,
          isLoading && styles.buttonDisabled
        ]}
        onPress={handleTakePhoto}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {ktpPhoto ? 'Ambil Ulang Foto KTP' : 'Ambil Foto KTP'}
          </Text>
        )}
      </TouchableOpacity>

      {ktpPhoto && (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: ktpPhoto.uri }}
            style={styles.photo}
            resizeMode="contain"
          />
          
          <View style={styles.photoInfo}>
            <Text style={styles.photoStatus}>
              {ktpPhoto.savedToGallery ? '✅ Tersimpan di galeri' : '⚠️ Hanya di aplikasi'}
            </Text>
            <Text style={styles.photoTime}>
              Diambil: {new Date(ktpPhoto.timestamp).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleClearPhoto}
          >
            <Text style={styles.deleteButtonText}>Hapus Foto</Text>
          </TouchableOpacity>
        </View>
      )}

      {!ktpPhoto && !isLoading && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips Foto KTP yang Baik:</Text>
          <Text style={styles.tip}>• Pastikan KTP dalam kondisi baik dan terbaca jelas</Text>
          <Text style={styles.tip}>• Foto dalam pencahayaan yang cukup</Text>
          <Text style={styles.tip}>• Pastikan semua informasi terbaca dengan jelas</Text>
          <Text style={styles.tip}>• Hindari bayangan pada KTP</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  photo: {
    width: 200,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  photoInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  photoStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  photoTime: {
    fontSize: 10,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  tip: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default KTPUploadScreen;