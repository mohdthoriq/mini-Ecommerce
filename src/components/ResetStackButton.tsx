import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const ResetStackButton = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleResetStack = () => {
    Alert.alert(
      'Reset Navigation',
      'Are you sure you want to reset the navigation stack and close the drawer?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset stack ke initial route (TopTabs)
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });

            // Tutup drawer secara programatik
            const parent = navigation.getParent<DrawerNavigationProp<{}>>();
            if (parent?.closeDrawer) {
              parent.closeDrawer();
            }

            Alert.alert('Success', 'Navigation stack has been reset!');
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleResetStack}>
      <Text style={styles.buttonText}>Reset Stack & Close Drawer</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff5722',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResetStackButton;