import React from 'react';
import { View, StyleSheet } from 'react-native';
import TopTabsNavigator from './TopTabsNavigator';

// This component wraps the Top Tabs with the Bottom Tabs navigation
const CategoriesWithTopTabs = () => {
  return (
    <View style={styles.container}>
      <TopTabsNavigator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CategoriesWithTopTabs;