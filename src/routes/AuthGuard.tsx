import React, { useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth
import { DrawerNavigationProp } from '@react-navigation/drawer'; 
import { RootDrawerParamList } from '../types';

/**
 * AUTH GUARD COMPONENT - UNIVERSAL NAVIGATION SUPPORT
 * Support untuk Stack Navigator DAN Drawer Navigator
 */

type NavigationProp = DrawerNavigationProp<RootDrawerParamList>;

interface AuthGuardProps {
  children: ReactNode;
  fallbackToLogin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallbackToLogin = false 
}) => {
  // ✅ Gunakan state dari AuthContext sebagai sumber kebenaran
  const { isAuthenticated, loadingAuth, setPostLoginRedirect } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  useEffect(() => {
    // Jika loading selesai dan user tidak terotentikasi, redirect
    if (!loadingAuth && !isAuthenticated && fallbackToLogin) {
      redirectToLogin();
    }
  }, [isAuthenticated, loadingAuth, fallbackToLogin]);

  /**
   * UNIVERSAL REDIRECT KE LOGIN
   * Work untuk Stack & Drawer navigator
   */
  const redirectToLogin = (): void => {
    // ✅ Simpan rute yang sedang dituju sebelum redirect
    // Ini akan digunakan setelah login berhasil
    console.log(`🔒 AuthGuard: User not authenticated. Storing redirect to "${route.name}" and redirecting to Login.`);
    setPostLoginRedirect({
      route: route.name as keyof RootDrawerParamList,
      params: route.params,
    });

    // Method 1: Reset navigation ke Login screen (universal)
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  const handleLoginRedirect = (): void => {
    redirectToLogin();
  };

  // Show loading indicator selama checking
  if (loadingAuth && fallbackToLogin) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // Jika authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Jika fallbackToLogin = true, kita sudah redirect, jadi return null
  if (fallbackToLogin) {
    return null;
  }

  // Show UI message jika tidak authenticated
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Authentication Required</Text>
      <Text style={styles.message}>
        You need to be logged in to access this content
      </Text>
      
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLoginRedirect}
      >
        <Text style={styles.loginButtonText}>Go to Login</Text>
      </TouchableOpacity>
      
      <Text style={styles.debugText}>
        Current route: {route.name} | Navigator: {navigation.getState().type}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e7d32',
    marginBottom: 20,
  },
  retryButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
  },
});

export default AuthGuard;