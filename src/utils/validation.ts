import { NewProduct, ErrorsState } from '../types';

export const validationForm = (product: NewProduct): ErrorsState => {
  const errors: ErrorsState = {};

  // Name validation
  if (!product.name.trim()) {
    errors.name = 'Product name is required';
  } else if (product.name.trim().length < 3) {
    errors.name = 'Product name must be at least 3 characters';
  } else if (product.name.trim().length > 100) {
    errors.name = 'Product name must be less than 100 characters';
  }

  // Price validation
  if (!product.price.trim()) {
    errors.price = 'Price is required';
  } else {
    const priceValue = Number(product.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      errors.price = 'Price must be a valid number greater than 0';
    } else if (priceValue > 10000000) {
      errors.price = 'Price must be less than 10,000,000';
    }
  }

  // Image URL validation
  if (!product.imageUrl.trim()) {
    errors.imageUrl = 'Image URL is required';
  } else if (!isValidUrl(product.imageUrl)) {
    errors.imageUrl = 'Please enter a valid image URL';
  } else if (product.imageUrl.length > 500) {
    errors.imageUrl = 'Image URL must be less than 500 characters';
  }

  // Description validation
  if (!product.description.trim()) {
    errors.description = 'Description is required';
  } else if (product.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (product.description.trim().length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return errors;
};

const isValidUrl = (url: string): boolean => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

// Additional validation utilities
export const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password.trim()) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone.trim()) {
    return 'Phone number is required';
  }
  
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return '';
};