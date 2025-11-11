// src/context/SwipeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SwipeContextType {
  canSwipe: boolean;
  setCanSwipe: (enabled: boolean) => void;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

interface SwipeProviderProps {
  children: ReactNode;
}

export const SwipeProvider: React.FC<SwipeProviderProps> = ({ children }) => {
  const [canSwipe, setCanSwipe] = useState(false);

  return (
    <SwipeContext.Provider value={{ canSwipe, setCanSwipe }}>
      {children}
    </SwipeContext.Provider>
  );
};

export const useSwipe = (): SwipeContextType => {
  const context = useContext(SwipeContext);
  if (context === undefined) {
    throw new Error('useSwipe must be used within a SwipeProvider');
  }
  return context;
};