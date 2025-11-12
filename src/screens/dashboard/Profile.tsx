import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { AuthContext } from '../../context/AuthContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, isAuthenticated, updateProfile, logout } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Load user data ketika component mount atau user berubah
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!userData.name.trim() || !userData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      updateProfile({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
      });
      
      setIsLoading(false);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }, 1500);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset ke data asli
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof typeof userData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            logout();
            navigation.navigate('RootDrawer');
          },
        },
      ]
    );
  };

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
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
            <FontAwesome6 name="camera" size={16} color="#ffffff" iconStyle='solid'/>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
        
        <View style={styles.memberSince}>
          <FontAwesome6 name="calendar" size={12} color="#666" />
          <Text style={styles.memberSinceText}>
            Member since {user.joinDate || 'Jan 2024'}
          </Text>
        </View>
      </View>

      {/* Profile Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <FontAwesome6 name="pen" size={14} color="#2e7d32" iconStyle='solid'/>
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
                keyboardType="email-address"
                autoCapitalize="none"
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
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{userData.phone || 'Not provided'}</Text>
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
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.value}>{userData.address || 'Not provided'}</Text>
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
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <FontAwesome6 name="check" size={16} color="#ffffff" iconStyle='solid'/>
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
            <FontAwesome6 name="heart" size={20} color="#2e7d32" iconStyle='solid'/>
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
          <FontAwesome6 name="credit-card" size={16} color="#2e7d32" iconStyle='solid'/>
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
          <FontAwesome6 name="shield" size={16} color="#2e7d32" iconStyle='solid'/>
          <Text style={styles.actionButtonText}> Privacy & Security</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    backgroundColor: '#1c964bff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#e8f5e9',
    marginBottom: 12,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberSinceText: {
    fontSize: 12,
    color: '#e8f5e9',
    opacity: 0.8,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff5722',
    padding: 16,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;