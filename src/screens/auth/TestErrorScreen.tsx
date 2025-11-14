import React from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const TestErrorScreen: React.FC = () => {
  const navigation = useNavigation();
  const [testMode, setTestMode] = React.useState<'safe' | 'error'>('safe');

  const goToHome = () => {
    navigation.navigate('Home' as never);
  };

  if (testMode === 'error') {
    console.log('💥 RENDERING ERROR VERSION');
    // VERSION WITH ERROR - untuk test Error Boundary
    const problematicObject: any = null;
    return (
      <View>
        <Text>{problematicObject.nonExistentProperty}</Text>
      </View>
    );
  }

  // SAFE MODE - langsung tampilkan opsi untuk ke Home
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧪 Test Error Boundary</Text>
        <Text style={styles.subtitle}>
          Pilih mode yang ingin di-test
        </Text>

        <View style={styles.modeContainer}>
          {/* MODE AMAN - langsung ke Home */}
          <View style={[styles.modeCard, styles.safeCard]}>
            <Text style={styles.modeTitle}>🔒 Mode Aman</Text>
            <Text style={styles.modeDescription}>
              Langsung kembali ke Home Screen tanpa error
            </Text>
            <TouchableOpacity 
              style={[styles.button, styles.safeButton]}
              onPress={goToHome}
            >
              <Text style={styles.buttonText}>Ke Home Screen</Text>
            </TouchableOpacity>
          </View>

          {/* MODE ERROR - test Error Boundary */}
          <View style={[styles.modeCard, styles.errorCard]}>
            <Text style={styles.modeTitle}>🚨 Mode Error</Text>
            <Text style={styles.modeDescription}>
              Test Error Boundary dengan memicu error
            </Text>
            <TouchableOpacity 
              style={[styles.button, styles.errorButton]}
              onPress={() => setTestMode('error')}
            >
              <Text style={styles.buttonText}>Test Error Boundary</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Cara Test Error Boundary:</Text>
          <Text style={styles.infoText}>
            1. Pilih "Mode Error"{'\n'}
            2. Error terjadi → Error Boundary aktif{'\n'}
            3. Tampil fallback UI dengan tombol{'\n'}
            4. Klik "Mulai Ulang" untuk reset aplikasi{'\n'}
            5. Kembali ke screen ini
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  modeContainer: {
    gap: 20,
    marginBottom: 30,
  },
  modeCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  safeCard: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2e7d32',
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  
  modeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  safeButton: {
    backgroundColor: '#2e7d32',
  },
  errorButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default TestErrorScreen;