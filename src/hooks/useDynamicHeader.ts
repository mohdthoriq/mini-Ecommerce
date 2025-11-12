// hooks/useDynamicHeader.ts
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const useDynamicHeader = (navigation: any, title: string, focusedTitle?: string) => {
  useFocusEffect(
    useCallback(() => {
      // Set title ketika tab focused
      navigation.setOptions({
        title: focusedTitle || title,
      });

      // Cleanup: kembalikan title ketika tab unfocused
      return () => {
        navigation.setOptions({
          title: title,
        });
      };
    }, [navigation, title, focusedTitle])
  );
};