// hooks/useTopSellingProducts.ts
import { useQuery } from '@tanstack/react-query';
import { 
  getTopSellingProducts, 
  GetTopSellingProductsParams, 
  TopSellingProductsResponse 
} from '@/(services)/api/topSellingProducts';

// Hook that ALWAYS fetches (no enabled condition)
export const useTopSellingProducts = (params?: GetTopSellingProductsParams) => {
  return useQuery<TopSellingProductsResponse, Error>({
    queryKey: ['topSellingProducts', params],
    queryFn: () => getTopSellingProducts(params || {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Alternative: Separate hooks for different use cases
export const useAllTopSellingProducts = () => {
  return useQuery<TopSellingProductsResponse, Error>({
    queryKey: ['topSellingProducts', 'all'],
    queryFn: () => getTopSellingProducts({}),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFilteredTopSellingProducts = (
  params?: GetTopSellingProductsParams
) => {
  return useQuery<TopSellingProductsResponse, Error>({
    queryKey: ['topSellingProducts', 'filtered', params],
    queryFn: () => getTopSellingProducts(params || {}),
    staleTime: 5 * 60 * 1000,
  });
};