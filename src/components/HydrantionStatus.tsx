import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HydrationState {
  isHydrated: boolean;
  progress: number;
  loadedServices: string[];
  failedServices: string[];
  errors: string[];
}

interface HydrationStatusProps {
  hydrationState: HydrationState;
}

const HydrationStatus: React.FC<HydrationStatusProps> = ({ hydrationState }) => {
  const { failedServices, errors } = hydrationState;

  if (failedServices.length === 0 && errors.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hydration Status</Text>
      
      {failedServices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fallback Services:</Text>
          {failedServices.map(service => (
            <Text key={service} style={styles.fallbackText}>
              ⚠️ {service} - Using default state
            </Text>
          ))}
        </View>
      )}
      
      {errors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Errors:</Text>
          {errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              ❌ {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 11,
    color: '#ff9800',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 11,
    color: '#f44336',
    marginBottom: 2,
  },
});

export default HydrationStatus;