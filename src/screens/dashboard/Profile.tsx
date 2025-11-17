import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList, User } from '../../types'; // Import User type
import { AuthContext } from '../../context/AuthContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

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
    updateProfile, 
    logout, 
    loadingAuth 
  } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

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
    return userData?.joinDate || '2024-01-01'; // Default value
  };

  // Load user data ketika component mount atau user berubah
  useEffect(() => {
    if (user) {
      setUserData(getUserData(user));
    }
  }, [user]);

  const handleSave = async () => {
    if (!userData.name.trim() || !userData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update profile dengan data yang valid
      updateProfile({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || undefined, // Convert empty string to undefined
        address: userData.address || undefined,
        // joinDate tetap tidak diubah karena readonly
      });
      
      setIsLoading(false);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset ke data asli
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
      'Yakin mau keluar dari akun lu?',
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
              await logout({ reason: 'user_initiated' });
            } catch (error) {
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
              await logout({ 
                clearAll: false, 
                reason: 'user_clear_data' 
              });
              Alert.alert('Success', 'All data has been cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };


  // Loading state
  if (loadingAuth) {
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
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(userData.name)}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <FontAwesome6 name="camera" size={16} color="#ffffff" iconStyle='solid' />
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
      </View>

      {/* Profile Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing ? (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleEdit}
              disabled={isLoading}
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
                editable={!isLoading}
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
                editable={!isLoading}
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
                editable={!isLoading}
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
                editable={!isLoading}
              />
            ) : (
              <Text style={styles.value}>
                {userData.address || 'Not provided'}
              </Text>
            )}
          </View>

          {/* Edit Mode Buttons */}
          {isEditing && (
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>
                  {isLoading ? 'Canceling...' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.saveButton,
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
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
          <Text style={styles.clearDataButtonText}>Factory Reset</Text>
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

// Styles tetap sama seperti sebelumnya
const styles = StyleSheet.create({
  // ... (styles dari kode sebelumnya tetap sama)
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
});

export default ProfileScreen;