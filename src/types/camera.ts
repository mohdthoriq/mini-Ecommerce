import { Asset } from 'react-native-image-picker';

export interface KTPPhoto {
  uri: string;
  type?: string;
  fileName: string;
  timestamp: string;
  savedToGallery: boolean;
}

export interface CameraPermissionResult {
  success: boolean;
  error?: string;
  photo?: Asset;
}

export interface ImagePickerOptions {
  mediaType?: 'photo' | 'video' | 'mixed';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  includeBase64?: boolean;
  saveToPhotos?: boolean;
  selectionLimit?: number;
}

export interface StoragePermissionConfig {
  title: string;
  message: string;
  buttonPositive: string;
  buttonNegative: string;
  buttonNeutral?: string;
}

// Response types untuk image picker
export interface ImagePickerResponse {
  assets: Asset[] | null;
  didCancel: boolean;
  errorCode?: string;
  errorMessage?: string;
}

// Hook return types
export interface UseKTPCameraReturn {
  ktpPhoto: KTPPhoto | null;
  isLoading: boolean;
  takeKTPPhoto: () => Promise<void>;
  clearKTPPhoto: () => Promise<void>;
}

export interface UseImagePickerReturn {
  selectedImage: Asset | null;
  isLoading: boolean;
  openCamera: (options?: Partial<ImagePickerOptions>) => Promise<Asset | null>;
  openGallery: (options?: Partial<ImagePickerOptions>) => Promise<Asset[] | null>;
  clearImage: () => void;
}

