import { NewProduct, ErrorsState } from '../types';

export const validationForm = (product: NewProduct): ErrorsState => {
  const errors: ErrorsState = {};

  if (!product.name.trim()) {
    errors.name = 'Nama produk harus diisi';
  } else if (product.name.trim().length < 3) {
    errors.name = 'Nama produk minimal 3 karakter';
  }

  if (!product.price.trim()) {
    errors.price = 'Harga produk harus diisi';
  } else if (isNaN(Number(product.price)) || Number(product.price) <= 0) {
    errors.price = 'Harga harus berupa angka yang valid';
  }

  if (!product.imageUrl.trim()) {
    errors.imageUrl = 'URL gambar harus diisi';
  } else if (!isValidUrl(product.imageUrl)) {
    errors.imageUrl = 'Format URL tidak valid';
  }

  return errors;
};

const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};