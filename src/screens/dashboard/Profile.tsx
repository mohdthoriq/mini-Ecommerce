// screens/dashboard/Profile.tsx
import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useImagePicker } from '../../utils/imagePicker';
import { useProductImagePicker } from '../../hooks/useProductImagePicker';
import KTPUploadScreen from '../../components/KTPUploadScreen';

// Extended interface untuk form data
interface UserFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const ProfileScreen = () => {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    updateProfile,
    logout,
    clearAllData
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { pickProductImages } = useProductImagePicker();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [cachedPreview, setCachedPreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  // ✅ UPDATE: Ambil isLoading dari useImagePicker
  const { 
    openCamera, 
    openGallery,
    openGalleryWithPreview,
    getCachedPreview,
    clearCachedPreview,
    isLoading: imagePickerLoading 
  } = useImagePicker();

  const [userData, setUserData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // ✅ LOAD CACHED PREVIEW SAAT COMPONENT MOUNT
  useEffect(() => {
    loadCachedPreview();
  }, []);

  const loadCachedPreview = async () => {
    setImageLoading(true);
    try {
      const preview = await getCachedPreview();
      if (preview) {
        setCachedPreview(preview);
        console.log('✅ Loaded cached preview from storage');
      }
    } catch (error) {
      console.error('Error loading cached preview:', error);
    } finally {
      setImageLoading(false);
    }
  };

  // Safe data extraction dengan fallbacks
  const getUserData = (userData: User | undefined): UserFormData => {
    return {
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      address: userData?.address || '',
    };
  };

  const getJoinDate = (userData: User | undefined): string => {
    return userData?.joinDate || '2024-01-01';
  };

  // Load user data ketika component mount atau user berubah
  useEffect(() => {
    if (user) {
      setUserData(getUserData(user));
    }
  }, [user]);

  // ✅ UPDATE: Fungsi media upload dengan loading state
  const handleMediaUpload = () => {
    Alert.alert(
      'Upload Photo',
      'Pilih sumber foto',
      [
        {
          text: 'Camera',
          onPress: async () => {
            setImageLoading(true);
            try {
              const media = await openCamera();
              if (!media || media.length === 0) {
                Alert.alert('Info', 'Tidak ada foto yang dipilih');
                return;
              }
              setProfileImage(media[0].uri!);
              Alert.alert('Sukses', 'Foto dari kamera berhasil diambil');
            } catch (error) {
              console.error('Camera error:', error);
              Alert.alert('Error', 'Gagal mengambil foto dari kamera');
            } finally {
              setImageLoading(false);
            }
          },
        },
        {
          text: 'Gallery (Dengan Preview Cepat)',
          onPress: async () => {
            setImageLoading(true);
            try {
              const { assets, base64Preview } = await openGalleryWithPreview();
              if (!assets || assets.length === 0) {
                Alert.alert('Info', 'Tidak ada foto yang dipilih');
                return;
              }

              const asset = assets[0];
              setProfileImage(asset.uri!);
              
              if (base64Preview) {
                setCachedPreview(base64Preview);
              }

              Alert.alert('Berhasil', 'Foto profil telah dipilih dan preview disimpan untuk akses cepat');
            } catch (error) {
              console.error('Gallery error:', error);
              Alert.alert('Error', 'Gagal memilih foto dari galeri');
            } finally {
              setImageLoading(false);
            }
          },
        },
        { 
          text: 'Gallery Biasa',
          onPress: async () => {
            setImageLoading(true);
            try {
              const media = await openGallery();
              if (!media || media.length === 0) {
                Alert.alert('Info', 'Tidak ada foto yang dipilih');
                return;
              }
              setProfileImage(media[0].uri!);
              Alert.alert('Sukses', 'Foto dari galeri berhasil dipilih');
            } catch (error) {
              console.error('Gallery error:', error);
              Alert.alert('Error', 'Gagal memilih foto dari galeri');
            } finally {
              setImageLoading(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  // ✅ UPDATE: Fungsi clear cache dengan loading
  const handleClearPreviewCache = async () => {
    setImageLoading(true);
    try {
      await clearCachedPreview();
      setCachedPreview(null);
      Alert.alert('Berhasil', 'Cache preview telah dihapus');
    } catch (error) {
      console.error('Clear cache error:', error);
      Alert.alert('Error', 'Gagal menghapus cache preview');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userData.name.trim() || !userData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      // ✅ TAMBAHKAN DELAY UNTUK SIMULASI PROSES SIMPAN
      await new Promise(resolve => setTimeout(resolve, 2000));

      updateProfile({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || undefined,
        address: userData.address || undefined,
      });

      setIsSaving(false);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Save profile error:', error);
      setIsSaving(false);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSelectImages = async () => {
    try {
      const photos = await pickProductImages();
      if (photos) {
        console.log('Selected photos:', photos);
        Alert.alert('Sukses', `${photos.length} foto produk berhasil dipilih`);
      }
    } catch (error) {
      console.error('Select product images error:', error);
      Alert.alert('Error', 'Gagal memilih foto produk');
    }
  };

  const handleCancel = () => {
    if (user) {
      setUserData(getUserData(user));
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Yakin mau keluar dari akun?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Ya, Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Logout failed. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove ALL your data including preferences, cart, and favorites. This action cannot be undone!',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared successfully');
            } catch (error) {
              console.error('Clear all data error:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Loading state - ✅ GUNAKAN isLoading DARI CONTEXT
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Jika belum login, tampilkan pesan
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <FontAwesome6 name="user-slash" size={64} color="#666" iconStyle='solid' />
          <Text style={styles.notLoggedInTitle}>Not Logged In</Text>
          <Text style={styles.notLoggedInText}>
            Please login to view your profile
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getInitials = (name: string) => {
    if (!name.trim()) return 'US';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatJoinDate = (joinDate: string) => {
    try {
      const date = new Date(joinDate);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return 'January 2024';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ✅ LOADING OVERLAY UNTUK IMAGE OPERATIONS */}
      {(imagePickerLoading || imageLoading) && (
        <View style={styles.globalLoadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingOverlayText}>
              {imagePickerLoading ? 'Memproses gambar...' : 'Menyimpan preview...'}
            </Text>
          </View>
        </View>
      )}

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {/* ✅ TAMPILKAN LOADING UNTUK AVATAR */}
          {(imagePickerLoading || imageLoading) ? (
            <View style={styles.avatarLoading}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          ) : profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.avatarImage}
            />
          ) : cachedPreview ? (
            <Image
              source={{ uri: cachedPreview }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userData.name)}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.editAvatarButton, 
              (imagePickerLoading || imageLoading) && styles.buttonDisabled
            ]} 
            onPress={handleMediaUpload}
            disabled={imagePickerLoading || imageLoading}
          >
            {(imagePickerLoading || imageLoading) ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <FontAwesome6 name="camera" size={16} color="#ffffff" iconStyle='solid' />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>

        <View style={styles.memberSince}>
          <FontAwesome6 name="calendar" size={12} color="#e8f5e9" iconStyle='solid' />
          <Text style={styles.memberSinceText}>
            Member since {formatJoinDate(getJoinDate(user))}
          </Text>
        </View>

        {/* ✅ INDIKATOR CACHED PREVIEW */}
        {cachedPreview && !imageLoading && (
          <View style={styles.cacheIndicator}>
            <FontAwesome6 name="bolt" size={12} color="#e8f5e9" iconStyle='solid' />
            <Text style={styles.cacheIndicatorText}>Preview Cepat Tersedia</Text>
          </View>
        )}
      </View>

      {/* Profile Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              disabled={isSaving || imageLoading}
            >
              <FontAwesome6 name="pen" size={14} color="#2e7d32" iconStyle='solid' />
              <Text style={styles.editButtonText}> Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.form}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <FontAwesome6 name="user" size={14} color="#2e7d32" iconStyle='solid' /> Full Name *
            </Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                editable={!isSaving && !imageLoading}
              />
            ) : (
              <Text style={styles.value}>{userData.name}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <FontAwesome6 name="envelope" size={14} color="#2e7d32" iconStyle='solid' /> Email Address *
            </Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSaving && !imageLoading}
              />
            ) : (
              <Text style={styles.value}>{userData.email}</Text>
            )}
          </View>

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <FontAwesome6 name="phone" size={14} color="#2e7d32" iconStyle='solid' /> Phone Number
            </Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                editable={!isSaving && !imageLoading}
              />
            ) : (
              <Text style={styles.value}>
                {userData.phone || 'Not provided'}
              </Text>
            )}
          </View>

          {/* Address Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <FontAwesome6 name="location-dot" size={14} color="#2e7d32" iconStyle='solid' /> Address
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={userData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Enter your address"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSaving && !imageLoading}
              />
            ) : (
              <Text style={styles.value}>
                {userData.address || 'Not provided'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.navigationButton, (imageLoading || isSaving) && styles.buttonDisabled]}
            onPress={() => navigation.navigate('KTPupload')}
            disabled={imageLoading || isSaving}
          >
            <FontAwesome6 name="id-card" size={16} color="#2e7d32" iconStyle='solid' />
            <Text style={styles.navigationButtonText}> Upload / Ambil Foto KTP</Text>
          </TouchableOpacity>

          {/* ✅ TOMBOL CLEAR CACHE PREVIEW DENGAN LOADING */}
          {cachedPreview && (
            <TouchableOpacity
              style={[styles.button, styles.clearCacheButton, imageLoading && styles.buttonDisabled]}
              onPress={handleClearPreviewCache}
              disabled={imageLoading}
            >
              {imageLoading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <>
                  <FontAwesome6 name="trash" size={14} color="#666" iconStyle='solid' />
                  <Text style={styles.clearCacheButtonText}> Hapus Cache Preview</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Edit Mode Buttons */}
          {isEditing && (
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, (isSaving || imageLoading) && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={isSaving || imageLoading}
              >
                <Text style={styles.cancelButtonText}>
                  {isSaving ? 'Canceling...' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  (isSaving || imageLoading) && styles.buttonDisabled
                ]}
                onPress={handleSave}
                disabled={isSaving || imageLoading}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <FontAwesome6 name="check" size={16} color="#ffffff" iconStyle='solid' />
                    <Text style={styles.saveButtonText}> Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Account Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <FontAwesome6 name="cart-shopping" size={20} color="#2e7d32" iconStyle='solid' />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="heart" size={20} color="#2e7d32" iconStyle='solid' />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="star" size={20} color="#2e7d32" iconStyle='solid' />
            <Text style={styles.statNumber}>47</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="award" size={20} color="#2e7d32" iconStyle='solid' />
            <Text style={styles.statNumber}>Gold</Text>
            <Text style={styles.statLabel}>Member</Text>
          </View>
        </View>
      </View>

      {/* Product Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Management</Text>
        <TouchableOpacity 
          style={[styles.actionButton, (imageLoading || isSaving) && styles.buttonDisabled]} 
          onPress={handleSelectImages}
          disabled={imageLoading || isSaving}
        >
          <FontAwesome6 name="images" size={16} color="#2e7d32" iconStyle='solid' />
          <Text style={styles.actionButtonText}> Pilih Foto Produk</Text>
        </TouchableOpacity>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>

        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome6 name="credit-card" size={16} color="#2e7d32" iconStyle='solid' />
          <Text style={styles.actionButtonText}> Payment Methods</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome6 name="location-arrow" size={16} color="#2e7d32" iconStyle='solid' />
          <Text style={styles.actionButtonText}> Shipping Addresses</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome6 name="bell" size={16} color="#2e7d32" iconStyle='solid' />
          <Text style={styles.actionButtonText}> Notification Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome6 name="shield" size={16} color="#2e7d32" iconStyle='solid' />
          <Text style={styles.actionButtonText}> Privacy & Security</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone Section */}
      <View style={styles.section}>
        <Text style={styles.dangerSectionTitle}>Danger Zone</Text>
        <Text style={styles.dangerSectionDescription}>
          These actions are irreversible. Please proceed with caution.
        </Text>

        <TouchableOpacity
          style={styles.clearDataButton}
          onPress={handleClearAllData}
        >
          <FontAwesome6 name="broom" size={16} color="#ef4444" iconStyle='solid' />
          <Text style={styles.clearDataButtonText}> Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <FontAwesome6 name="right-from-bracket" size={16} color="#ffffff" iconStyle='solid' />
          <Text style={styles.logoutButtonText}> Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9bf89bff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#9bf89bff',
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 20,
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#2e7d32',
    padding: 30,
    alignItems: 'center',
    paddingTop: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  avatarLoading: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1b5e20',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#e8f5e9',
    marginBottom: 12,
    textAlign: 'center',
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberSinceText: {
    fontSize: 12,
    color: '#e8f5e9',
    opacity: 0.9,
  },
  cacheIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cacheIndicatorText: {
    fontSize: 11,
    color: '#e8f5e9',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  dangerSectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    lineHeight: 24,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  navigationButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearCacheButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearCacheButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 12,
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearDataButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
  globalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingOverlayText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

export default ProfileScreen;