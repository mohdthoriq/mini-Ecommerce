import { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkParams {
  [key: string]: string;
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

// ✅ NEW TYPES FOR ADD-TO-CART DEEP LINK
export interface AddToCartDeepLink {
  type: 'add-to-cart';
  productId: string;
}

export interface ViewProductDeepLink {
  type: 'view-product';
  productId: string;
}

export interface OpenCartDeepLink {
  type: 'open-cart';
}

// ⬇️⬇️⬇️ TAMBAHIN INI BRO ⬇️⬇️⬇️
export interface FallbackDeepLink {
  type: 'fallback';
  reason?: string;
}
// ⬆️⬆️⬆️ TAMBAHIN INI BRO ⬆️⬆️⬆️

export type DeepLinkAction =
  | AddToCartDeepLink
  | ViewProductDeepLink
  | OpenCartDeepLink
  | FallbackDeepLink; // ⬅️ masukin ke union

export interface DeepLinkResult {
  success: boolean;
  action: DeepLinkAction;
  error?: string;
}


export type ParsedDeepLink = DeepLinkResult;