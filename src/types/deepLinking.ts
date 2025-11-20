import { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkParams {
  [key: string]: string;
}

export interface ParsedDeepLink {
  route: string;
  params: DeepLinkParams;
}

export interface DeepLinkingHandlerInterface {
  setNavigationRef: (ref: React.RefObject<NavigationContainerRef<any>>) => void;
  initialize: () => Promise<string | null>;
  cleanup: () => void;
  handleDeepLink: (url: string | null) => void;
  handleNativeDeepLink: (url: string) => void;
  processPendingUrl: () => void;
  isHandlerReady: () => boolean;
  getState: () => {
    isReady: boolean;
    pendingUrl: string | null;
    hasNavigationRef: boolean;
  };
}

export interface UseDeepLinkingReturn {
  isDeepLinkingReady: boolean;
  processPendingUrl: () => void;
}