import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import Icon from "@react-native-vector-icons/fontawesome6";
import { useNavigation } from '@react-navigation/native';

export default function CustomDrawerContent(props: any) {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin logout?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => console.log('User logged out')
        },
      ]
    );
  };

  const navigateToHome = () => {
    navigation.navigate('Main' as never);
    props.navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        {/* Header dengan Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Icon name="check" size={12} color="#fff" iconStyle='solid' />
            </View>
          </View>
          <Text style={styles.userName}>John Smith</Text>
          <Text style={styles.userEmail}>john.smith@example.com</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Footer dengan Tombol Logout */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={navigateToHome}
        >
          <Icon name="house" size={20} color="#4caf50" iconStyle='solid' />
          <Text style={styles.homeButtonText}>Kembali ke Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="right-from-bracket" size={20} color="#ff6b6b" iconStyle='solid' />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
  header: {
    padding: 20,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8d4',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4caf50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#e8f5e8',
    opacity: 0.9,
  },
  menuSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#d4e8d4',
    backgroundColor: '#ffffff',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    marginBottom: 12,
  },
  homeButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  logoutButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
  },
});