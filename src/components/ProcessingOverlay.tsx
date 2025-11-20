import React from 'react';
import { View, Text, StatusBar, ActivityIndicator } from 'react-native';

interface ProcessingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Overlay component untuk menunjukkan processing state
 */
const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ 
  visible, 
  message = "Processing..." 
}) => {
  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={{
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 150,
      }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ 
          color: '#ffffff', 
          marginTop: 10, 
          fontSize: 16,
          textAlign: 'center'
        }}>
          {message}
        </Text>
      </View>
    </View>
  );
};

export default ProcessingOverlay;