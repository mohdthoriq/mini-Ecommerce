import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';

interface SplashScreenProps {
  progress: number;
  loadedServices: string[];
  failedServices: string[];
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  progress, 
  loadedServices, 
  failedServices,
  message = "Loading your experience..." 
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* App Logo/Brand */}
      <View style={styles.brandContainer}>
        <Text style={styles.logo}>🛍️</Text>
        <Text style={styles.appName}>E-Commerce App</Text>
        <Text style={styles.tagline}>Your Shopping Companion</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>{message}</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View 
              style={[
                styles.progressFill,
                { width: progressWidth }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Service Status */}
        <View style={styles.servicesContainer}>
          {loadedServices.map(service => (
            <Text key={service} style={styles.serviceSuccess}>
              ✅ {service}
            </Text>
          ))}
          {failedServices.map(service => (
            <Text key={service} style={styles.serviceError}>
              ⚠️ {service} (Using default)
            </Text>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Preparing your personalized experience...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9bf89bff',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2e7d32',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  servicesContainer: {
    width: '80%',
    maxHeight: 120,
  },
  serviceSuccess: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 4,
  },
  serviceError: {
    fontSize: 12,
    color: '#ff9800',
    marginBottom: 4,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default SplashScreen;