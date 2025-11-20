import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { ReactNode } from 'react';

const AuthGuard = ({ children }: { children: ReactNode }) => {
    const navigation = useNavigation();
    const { isAuthenticated } = useContext(AuthContext);

    const handleLoginRedirect = () => {
      navigation.navigate('Login' as never);
    };

    if (!isAuthenticated) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>🔒 Authentication Required</Text>
          <Text style={styles.message}>
            Harap Login untuk mengakses konten ini
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLoginRedirect}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthGuard;