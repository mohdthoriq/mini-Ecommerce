import React from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar 
} from 'react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private shouldBlockRender: boolean = false;
  private resetInProgress: boolean = false;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('🛑 ERROR BOUNDARY CAUGHT AN ERROR:');
    console.error('Error Message:', error.message);

    this.setState({ error });
    this.shouldBlockRender = true;
  }

  resetError = (): void => {
    if (this.resetInProgress) {
      console.log('⏳ Reset already in progress...');
      return;
    }
    
    this.resetInProgress = true;
    console.log('🔄 Starting error boundary reset...');

    // Step 1: Reset state dulu
    this.shouldBlockRender = false;
    this.setState({
      hasError: false,
      error: null
    });

    // Step 2: Beri waktu untuk React update state, baru trigger parent reset
    setTimeout(() => {
      console.log('🎯 Triggering parent reset...');
      if (this.props.onReset) {
        this.props.onReset();
      }
      
      // Reset flag setelah semua proses selesai
      setTimeout(() => {
        this.resetInProgress = false;
        console.log('✅ Reset completed');
      }, 500);
    }, 100);
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      console.log('🚫 BLOCKING re-render - showing fallback UI');
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar backgroundColor="#d32f2f" barStyle="light-content" />
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
              <Text style={styles.emoji}>🚨</Text>
              <Text style={styles.title}>Maaf, Terjadi Gangguan</Text>
              <Text style={styles.message}>
                Aplikasi mengalami masalah tak terduga.
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={this.resetError}
                  disabled={this.resetInProgress}
                >
                  <Text style={[
                    styles.primaryButtonText,
                    this.resetInProgress && styles.disabledText
                  ]}>
                    {this.resetInProgress ? 'Memuat Ulang...' : 'Mulai Ulang Aplikasi'}
                  </Text>
                </TouchableOpacity>
              </View>

              {__DEV__ && error && (
                <View style={styles.debugSection}>
                  <Text style={styles.debugTitle}>Error Details:</Text>
                  <Text style={styles.debugText}>{error.message}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }
    if (this.state.hasError) return null;
    return children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#424242',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.6,
  },
  debugSection: {
    width: '100%',
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#424242',
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;