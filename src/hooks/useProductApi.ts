import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import productApi from '../services/api/productApi';

interface UseProductApiResult {
  data: Product[] | Product | string[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useProductApi = (
  apiCall: () => Promise<any>,
  dependencies: any[] = []
): UseProductApiResult => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    execute();
  }, dependencies);

  return { data, loading, error, refetch: execute };
};

// Specific hooks for common use cases
export const useAllProducts = () => {
  return useProductApi(() => productApi.getAllProducts());
};

export const useProductById = (id: string) => {
  return useProductApi(() => productApi.getProductById(id), [id]);
};

export const useProductsByCategory = (category: string) => {
  return useProductApi(() => productApi.getProductsByCategory(category), [category]);
};

export const useSearchProducts = (query: string) => {
  return useProductApi(() => productApi.searchProducts(query), [query]);
};

export const useCategories = () => {
  return useProductApi(() => productApi.getCategories());
};