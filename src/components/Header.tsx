import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  isLandscape?: boolean;
  screenWidth?: number;
}

const Header: React.FC<HeaderProps> = ({ isLandscape = false, screenWidth }) => {
  // 🔥 HOOK SAFE AREA
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const containerWidth = screenWidth || width;

  return (
    <View style={[
      styles.header,
      { 
        paddingTop: insets.top + 16, // 🔥 PADDING UNTUK SAFE AREA
        paddingBottom: isLandscape ? 12 : 16,
      }
    ]}>
      <View style={[styles.headerContent, { width: containerWidth }]}>
        <Text style={[
          styles.title,
          isLandscape && styles.landscapeTitle
        ]}>
          Mini Commerce
        </Text>
        <Text style={[
          styles.subtitle,
          isLandscape && styles.landscapeSubtitle
        ]}>
          Temukan produk terbaik untuk Anda
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FF4444',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  landscapeTitle: {
    fontSize: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  landscapeSubtitle: {
    fontSize: 12,
  },
});

export default Header;  