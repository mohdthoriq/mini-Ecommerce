import { NewProduct, ErrorsState } from '../types';

// Product Validations
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

// Auth Validations
export const validateUsername = (username: string): string => {
  if (!username.trim()) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }
  return '';
};

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
  
  // Optional: Add more password strength rules
  if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
    return 'Password should contain both uppercase and lowercase letters';
  }
  
  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone.trim()) {
    return 'Phone number is required';
  }
  
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  
  if (cleanPhone.length > 15) {
    return 'Phone number is too long';
  }
  
  return '';
};

// Profile Validations
export const validateFullName = (name: string): string => {
  if (!name.trim()) {
    return 'Full name is required';
  }
  
  if (name.trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }
  
  if (name.trim().length > 50) {
    return 'Full name must be less than 50 characters';
  }
  
  return '';
};

export const validateAddress = (address: string): string => {
  if (!address.trim()) {
    return 'Address is required';
  }
  
  if (address.trim().length < 10) {
    return 'Address must be at least 10 characters';
  }
  
  return '';
};

// Utility Functions
const isValidUrl = (url: string): boolean => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

// Export all validations as a single object for easier imports
export const Validations = {
  product: validationForm,
  username: validateUsername,
  email: validateEmail,
  password: validatePassword,
  phone: validatePhone,
  fullName: validateFullName,
  address: validateAddress,
};