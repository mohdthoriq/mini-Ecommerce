import React from 'react';
import { View } from 'react-native';
import { useInternet } from '../context/InternetContext';
import OfflineBanner from './OfflineBanner';

interface InternetStatusHandlerProps {
  children: React.ReactNode;
}

/**
 * Component untuk handle internet status secara global
 * Wrap ini di sekitar app content Anda
 */
const InternetStatusHandler: React.FC<InternetStatusHandlerProps> = ({ 
  children 
}) => {
  const { isInternetReachable, isCheckingConnection } = useInternet();

  // Anda bisa tambahkan logic global di sini
  // Contoh: prevent API calls ketika offline, dll.

  return (
    <View style={{ flex: 1 }}>
      {/* Offline Banner akan muncul di atas semua content */}
      <OfflineBanner />
      
      {/* Main App Content */}
      <View style={{ 
        flex: 1,
        opacity: isInternetReachable ? 1 : 0.6 // Optional: reduce opacity when offline
      }}>
        {children}
      </View>
    </View>
  );
};

export default InternetStatusHandler;