import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useInternet } from '../context/InternetContext';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const OfflineBanner: React.FC = () => {
  const { isInternetReachable, isCheckingConnection } = useInternet();
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isInternetReachable && !isCheckingConnection) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isInternetReachable, isCheckingConnection, slideAnim, pulseAnim]);

  // Don't show banner if checking connection or internet is reachable
  if (isCheckingConnection || isInternetReachable) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.banner,
        {
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim }
          ]
        }
      ]}
    >
      <View style={styles.bannerContent}>
        <View style={styles.iconContainer}>
          <FontAwesome6 
            name="wifi" 
            size={16} 
            color="#ffffff" 
            iconStyle='solid'
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>Tidak Terkoneksi</Text>
          <Text style={styles.bannerSubtitle}>Periksa koneksi internet Anda</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={styles.pulsingDot} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dc2626',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12, // Account for status bar on iOS
  },
  iconContainer: {
    marginRight: 12,
    opacity: 0.9,
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '400',
  },
  statusIndicator: {
    marginLeft: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
});

export default OfflineBanner;