import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface InternetContextType {
  isInternetReachable: boolean;
  isCheckingConnection: boolean;
}

const InternetContext = createContext<InternetContextType | undefined>(undefined);

export const useInternet = () => {
  const context = useContext(InternetContext);
  if (context === undefined) {
    throw new Error('useInternet must be used within an InternetProvider');
  }
  return context;
};

interface InternetProviderProps {
  children: React.ReactNode;
}

export const InternetProvider: React.FC<InternetProviderProps> = ({ children }) => {
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      console.log('🌐 Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      });

      setIsCheckingConnection(false);

      // Handle connection loss
      if (state.isConnected === false || state.isInternetReachable === false) {
        if (isInternetReachable) {
          console.warn('📵 Koneksi terputus. Menggunakan mode offline.');
          setIsInternetReachable(false);
        }
      } 
      // Handle connection recovery
      else if (state.isConnected === true && state.isInternetReachable === true) {
        if (!isInternetReachable) {
          console.log('✅ Koneksi pulih. Melanjutkan operasi.');
          setIsInternetReachable(true);
        }
      }
    });

    // Initial network check
    const checkInitialConnection = async () => {
      try {
        const state = await NetInfo.fetch();
        console.log('🔍 Initial network state:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable
        });
        
        setIsInternetReachable(state.isConnected === true && state.isInternetReachable === true);
        setIsCheckingConnection(false);
      } catch (error) {
        console.error('❌ Error checking initial network state:', error);
        setIsCheckingConnection(false);
      }
    };

    checkInitialConnection();

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [isInternetReachable]);

  const value: InternetContextType = {
    isInternetReachable,
    isCheckingConnection
  };

  return (
    <InternetContext.Provider value={value}>
      {children}
    </InternetContext.Provider>
  );
};