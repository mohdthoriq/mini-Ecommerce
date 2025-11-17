// utils/storageKeys.ts
export const STORAGE_KEYS = {
  // Authentication data
  USER_TOKEN: 'userToken',
  USER_DATA: 'userData',
  SESSION_ID: 'sessionId',
  REFRESH_TOKEN: 'refreshToken',
  
  // App settings
  APP_THEME: 'appTheme',
  NOTIFICATION_STATUS: 'notificationStatus',
  LANGUAGE: 'appLanguage',
  FIRST_LAUNCH: 'firstLaunch',
  
  // User preferences
  USER_PREFERENCES: 'userPreferences',
  RECENT_SEARCHES: 'recentSearches',
  FAVORITE_PRODUCTS: 'favoriteProducts',
  
  // Cart data
  CART_DATA: 'cartData',
  CART_BACKUP: 'cartBackup',
  
  // Temporary data
  PENDING_ORDERS: 'pendingOrders',
  DRAFT_DATA: 'draftData',
} as const;

// Keys yang akan dihapus saat logout
export const SENSITIVE_KEYS = [
  STORAGE_KEYS.USER_TOKEN,
  STORAGE_KEYS.USER_DATA,
  STORAGE_KEYS.SESSION_ID,
  STORAGE_KEYS.REFRESH_TOKEN,
  STORAGE_KEYS.USER_PREFERENCES,
  STORAGE_KEYS.RECENT_SEARCHES,
  STORAGE_KEYS.FAVORITE_PRODUCTS,
  STORAGE_KEYS.CART_DATA,
  STORAGE_KEYS.CART_BACKUP,
  STORAGE_KEYS.PENDING_ORDERS,
  STORAGE_KEYS.DRAFT_DATA,
] as const;

// Keys yang akan dipertahankan saat logout
export const PERSISTENT_KEYS = [
  STORAGE_KEYS.APP_THEME,
  STORAGE_KEYS.NOTIFICATION_STATUS,
  STORAGE_KEYS.LANGUAGE,
  STORAGE_KEYS.FIRST_LAUNCH,
] as const;