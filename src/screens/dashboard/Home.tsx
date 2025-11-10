import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import TopTabsNavigator from '../../routes/TopTabsNavigator';
import Icon from "@react-native-vector-icons/fontawesome6";

export default function Home() {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🔥 CUSTOM HEADER DENGAN MENU BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <Icon name="bars" size={20} color="#2e7d32" iconStyle='solid' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EcoTech Fashion</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      <View style={styles.container}>
        <TopTabsNavigator />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8d4',
    shadowColor: '#2e7d32',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  headerPlaceholder: {
    width: 36,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f7f0',
  },
});