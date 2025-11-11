import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { AuthContext } from '../context/AuthContext';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation } = props;
  const { isAuthenticated, user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigation.closeDrawer();
  };

  const handleLogin = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Login',
      })
    );
    navigation.closeDrawer();
  };

  const handleCategories = () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    // Navigate ke Categories dengan Bottom Tabs
    navigation.dispatch(
      CommonActions.navigate({
        name: 'CategoriesWithBottomTabs', // Arahkan ke tab 'Categories'
      })
    );
    navigation.closeDrawer();
  };

  const handleProfile = () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    // ✅ PERBAIKAN: Navigate ke ProfileTab (karena Profile ada di BottomTabs)
    navigation.dispatch(
      CommonActions.navigate({
        name: 'CategoriesWithBottomTabs', // ✅ Navigate ke BottomTabs dulu
      })
    );
    // Setelah navigate ke BottomTabs, pindah ke tab Profile
    setTimeout(() => {
      navigation.navigate('ProfileTab'); // ✅ Ini akan work karena sudah di BottomTabs context
    }, 100);
    navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {isAuthenticated && user ? (
            <Text style={styles.avatarText}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </Text>
          ) : (
            <FontAwesome6 name="user" size={24} color="#ffffff" iconStyle='solid' />
          )}
        </View>
        <Text style={styles.userName}>
          {isAuthenticated && user ? user.name : 'Welcome Guest'}
        </Text>
        <Text style={styles.userEmail}>
          {isAuthenticated && user ? user.email : 'Please login to continue'}
        </Text>
        <Text style={styles.storeName}>Eco Shop</Text>
        {isAuthenticated && (
          <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
            <Text style={styles.profileButtonText}>View Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <DrawerContentScrollView 
        {...props}
        style={styles.drawerScroll}
        contentContainerStyle={styles.drawerContent}
      >
        {/* Main Navigation Items */}
        <View style={styles.section}>
          <DrawerItem
            label="Home"
            onPress={() => navigation.navigate('Home')}
            labelStyle={styles.drawerLabel}
            icon={({ color, size }) => (
              <FontAwesome6 name="house" size={size} color={color} iconStyle='solid' />
            )}
          />
          <DrawerItem
            label="Categories"
            onPress={handleCategories}
            labelStyle={styles.drawerLabel}
            icon={({ color, size }) => (
              <FontAwesome6 name="cube" size={size} color={color} iconStyle='solid' />
            )}
          />
          <DrawerItem
            label="Profile"
            onPress={handleProfile}
            labelStyle={styles.drawerLabel}
            icon={({ color, size }) => (
              <FontAwesome6 name="user" size={size} color={color} iconStyle='solid' />
            )}
          />
          <DrawerItem
            label="Settings"
            onPress={() => navigation.navigate('Settings')}
            labelStyle={styles.drawerLabel}
            icon={({ color, size }) => (
              <FontAwesome6 name="gear" size={size} color={color} iconStyle='solid' />
            )}
          />
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isAuthenticated ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome6 name="right-from-bracket" size={16} color="#ffffff" iconStyle='solid' />
            <Text style={styles.logoutText}> Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <FontAwesome6 name="right-to-bracket" size={16} color="#ffffff" iconStyle='solid' />
            <Text style={styles.loginText}> Login</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.version}>Eco Store v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
  header: {
    backgroundColor: '#2e7d32',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#e8f5e9',
    opacity: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    paddingTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2e7d32',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#d4e8d4',
    backgroundColor: '#ffffff',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  loginText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff5722',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default CustomDrawerContent;