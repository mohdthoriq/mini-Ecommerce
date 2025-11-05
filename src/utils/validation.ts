import { FormErrors, NewProduct } from "../types";

export const validationForm = (product: NewProduct): FormErrors => {
    const errors: FormErrors = {}

    if (!product.name.trim()) {
        errors.name = 'Nama Produk wajib diisi'
    } else if (product.name.trim().length < 3) {
        errors.name = 'Nama Produk minimal 3 karakter'
    }

    if (!product.price.toString().trim()) {
        errors.price = 'Harga Produk wajib diisi'
    } else if (isNaN(Number(product.price)) || Number(product.price) <= 0) {
        errors.price = 'Harga Produk harus berupa angka positif'
    }

    if (!product.imageUrl.trim()) {
    errors.imageUrl = 'URL gambar wajib diisi';
  } else if (!isValidUrl(product.imageUrl)) {
    errors.imageUrl = 'Format URL tidak valid. Gunakan http:// atau https://';
  }

    return errors;
}

export const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};