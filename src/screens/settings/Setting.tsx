import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from "@react-native-vector-icons/fontawesome6";
import { useDrawerLock } from '../../routes';

export default function Settings() {
  const navigation = useNavigation();
  const { drawerLocked, setDrawerLocked } = useDrawerLock();

  const handleToggleDrawerLock = () => {
    setDrawerLocked(!drawerLocked);
  };

  const handleNavigateHome = () => {
    navigation.navigate('Main' as never);
    // Close drawer programmatically
    navigation.dispatch({ type: 'CLOSE_DRAWER' } as never);
  };

  const showLockInfo = () => {
    Alert.alert(
      'Kunci Navigasi',
      `Swipe gesture Drawer saat ini: ${drawerLocked ? 'TERKUNCI' : 'TERBUKA'}\n\nKetika terkunci, Drawer hanya bisa dibuka melalui tombol menu.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ Pengaturan</Text>
            <Text style={styles.subtitle}>Kelola preferensi aplikasi</Text>
          </View>

          {/* Drawer Lock Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navigasi</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="lock" size={20} color="#4caf50" iconStyle='solid' />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Kunci Swipe Drawer</Text>
                  <Text style={styles.settingDescription}>
                    {drawerLocked 
                      ? 'Drawer terkunci - hanya bisa dibuka via tombol' 
                      : 'Drawer terbuka - bisa dibuka via swipe gesture'}
                  </Text>
                </View>
              </View>
              <Switch
                value={!drawerLocked}
                onValueChange={handleToggleDrawerLock}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={!drawerLocked ? '#2196F3' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity 
              style={styles.infoButton}
              onPress={showLockInfo}
            >
              <Icon name="circle-info" size={16} color="#2196F3" iconStyle='solid' />
              <Text style={styles.infoButtonText}>Info Kunci Navigasi</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleNavigateHome}
            >
              <View style={styles.actionButtonContent}>
                <Icon name="house" size={20} color="#4caf50" iconStyle='solid' />
                <Text style={styles.actionButtonText}>Kembali ke Home</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#666" iconStyle='solid' />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionButtonContent}>
                <Icon name="bell" size={20} color="#4caf50" />
                <Text style={styles.actionButtonText}>Notifikasi</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#666" iconStyle='solid' />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionButtonContent}>
                <Icon name="palette" size={20} color="#4caf50" iconStyle='solid' />
                <Text style={styles.actionButtonText}>Tema & Tampilan</Text>
              </View>
              <Icon name="chevron-right" size={16} color="#666" iconStyle='solid' />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>EcoTech Fashion</Text>
              <Text style={styles.infoVersion}>Versi 1.0.0</Text>
              <Text style={styles.infoDescription}>
                Aplikasi e-commerce untuk produk elektronik dan fashion sustainable.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4caf50',
    opacity: 0.8,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2e7d32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#4caf50',
    opacity: 0.8,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  infoButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  infoVersion: {
    fontSize: 14,
    color: '#4caf50',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#388e3c',
    lineHeight: 20,
  },
});