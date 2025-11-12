import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSwipe } from '../../context/SwipeContext';


const SettingsScreen = () => {
  const navigation = useNavigation();
  const { canSwipe, setCanSwipe } = useSwipe();
  
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSync: true,
    locationServices: false,
    biometricLogin: true,
    swipeDrawer: canSwipe
  });

  const [userPreferences, setUserPreferences] = useState({
    language: 'English',
    currency: 'USD',
    region: 'United States',
  });

  const [feedback, setFeedback] = useState('');

  const handleToggleSetting = (setting: keyof typeof settings) => {
    const newValue = !settings[setting];
    
    setSettings(prev => ({
      ...prev,
      [setting]: newValue,
    }));

    // ✅ INTEGRASI SWIPE DRAWER DENGAN CONTEXT
   if (setting === 'swipeDrawer') {
      setCanSwipe(newValue);
      Alert.alert(
        'Swipe Drawer',
        newValue
          ? 'Swipe gesture enabled! You can now open drawer by swiping from the edge.'
          : 'Swipe gesture disabled! Drawer can only be opened via toggle icon.',
        [{ text: 'OK' }]
      );
    }
  };

  // ✅ SYNC SETTINGS DENGAN CONTEXT SETIAP SWIPEEnabled BERUBAH
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      swipeDrawer: canSwipe,
    }));
  }, [canSwipe]);

  const handleSavePreferences = () => {
    Alert.alert('Success', 'Preferences saved successfully!');
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim().length < 10) {
      Alert.alert('Error', 'Please provide feedback with at least 10 characters.');
      return;
    }
    
    Alert.alert('Thank You', 'Your feedback has been submitted!');
    setFeedback('');
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully!');
          },
        },
      ]
    );
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
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            Alert.alert('Success', 'You have been logged out!');
            navigation.goBack();
          },
        },
      ]
    );
  };


  return (
    <ScrollView style={styles.container}>
      {/* Header */}
       <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your app preferences and account settings
        </Text>
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        {/* ✅ SWIPE DRAWER TOGGLE - TERINTEGRASI DENGAN CONTEXT */}
         <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Swipe to Open Drawer</Text>
            <Text style={styles.settingDescription}>
              {settings.swipeDrawer 
                ? 'Drawer can be opened by swiping from screen edge' 
                : 'Drawer can only be opened via toggle icon'
              }
            </Text>
          </View>
          <Switch
            value={settings.swipeDrawer}
            onValueChange={() => handleToggleSetting('swipeDrawer')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.swipeDrawer ? '#2e7d32' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive updates about new products and promotions
            </Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={() => handleToggleSetting('notifications')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.notifications ? '#2e7d32' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Switch to dark theme for better night viewing
            </Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={() => handleToggleSetting('darkMode')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.darkMode ? '#2e7d32' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Auto Sync</Text>
            <Text style={styles.settingDescription}>
              Automatically sync your data with the cloud
            </Text>
          </View>
          <Switch
            value={settings.autoSync}
            onValueChange={() => handleToggleSetting('autoSync')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.autoSync ? '#2e7d32' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Location Services</Text>
            <Text style={styles.settingDescription}>
              Allow app to access your location for better recommendations
            </Text>
          </View>
          <Switch
            value={settings.locationServices}
            onValueChange={() => handleToggleSetting('locationServices')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.locationServices ? '#2e7d32' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>Biometric Login</Text>
            <Text style={styles.settingDescription}>
              Use fingerprint or face ID for faster login
            </Text>
          </View>
          <Switch
            value={settings.biometricLogin}
            onValueChange={() => handleToggleSetting('biometricLogin')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.biometricLogin ? '#2e7d32' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Language</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.preferenceText}>{userPreferences.language}</Text>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Currency</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.preferenceText}>{userPreferences.currency}</Text>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Region</Text>
          <View style={styles.preferenceValue}>
            <Text style={styles.preferenceText}>{userPreferences.region}</Text>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePreferences}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <Text style={styles.feedbackDescription}>
          We'd love to hear your thoughts and suggestions to improve our app.
        </Text>

        <TextInput
          style={styles.feedbackInput}
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Tell us what you think..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.feedbackButton,
            feedback.trim().length < 10 && styles.feedbackButtonDisabled
          ]}
          onPress={handleSubmitFeedback}
          disabled={feedback.trim().length < 10}
        >
          <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearCacheButton]}
          onPress={handleClearCache}
        >
          <Text style={styles.actionButtonText}>🗑️ Clear Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.helpButton]}
        >
          <Text style={styles.actionButtonText}>❓ Help & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.aboutButton]}
        >
          <Text style={styles.actionButtonText}>ℹ️ About App</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={styles.deleteButtonText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Eco Store v1.0.0</Text>
        <Text style={styles.appCopyright}>© 2024 Eco Store. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2e7d32',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e8f5e9',
    opacity: 0.9,
    lineHeight: 20,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  preferenceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceText: {
    fontSize: 14,
    color: '#666',
  },
  changeButton: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  feedbackInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  feedbackButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackButtonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.6,
  },
  feedbackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  clearCacheButton: {
    backgroundColor: '#fff3e0',
    borderColor: '#ffb74d',
  },
  helpButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#64b5f6',
  },
  aboutButton: {
    backgroundColor: '#f3e5f5',
    borderColor: '#ba68c8',
  },
  logoutButton: {
    backgroundColor: '#ffebee',
    borderColor: '#ef5350',
  },
  deleteButton: {
    backgroundColor: '#fbe9e7',
    borderColor: '#ff8a65',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;