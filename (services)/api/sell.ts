import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from "@/(utils)/config";
import { GetAllSellsUserParams, GetAllSellsUserResponse } from "@/(utils)/types";

// Query keys
export const sellsKeys = {
  all: ['sells'] as const,
  lists: () => [...sellsKeys.all, 'list'] as const,
  list: (filters: GetAllSellsUserParams) => [...sellsKeys.lists(), filters] as const,
  userSells: (userId?: string) => [...sellsKeys.all, 'user', userId] as const,
  detail: (id: string) => [...sellsKeys.all, 'detail', id] as const,
  convert: (sellId: string) => [...sellsKeys.all, 'convert', sellId] as const,
};

// Get all sells for a specific user
export const getAllSellsUser = async (
  params: GetAllSellsUserParams
): Promise<GetAllSellsUserResponse> => {
  try {
    const response = await api.get("/sells/user/based", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        customerName: params.customerName,
        status: params.status,
      }
    });
    
    return {
      success: true,
      sells: response.data.sells || [],
      count: response.data.count || 0,
      meta: response.data.meta || {},
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch user sells");
  }
};

// React Query hook for fetching user sells
export const useUserSells = (params: GetAllSellsUserParams) => {
  return useQuery<GetAllSellsUserResponse, Error>({
    queryKey: sellsKeys.list(params),
    queryFn: () => getAllSellsUser(params),
    // Optional: Add staleTime, cacheTime, etc.
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!params, // Only run query if params exist
    // Transform data if needed
    select: (data) => ({
      ...data,
      // You can transform the data here
      sells: data.sells || [],
    }),
  });
};

export interface ConvertOrderResponse {
  success: boolean;
  message: string;
  cart: any;
  originalOrder: {
    invoiceNo: string;
    saleStatus: string;
    grandTotal: number;
    totalProducts: number;
  };
}

// Convert order to cart
export const convertOrderToCart = async (
  sellId: string
): Promise<ConvertOrderResponse> => {
  try {
    const response = await api.post(`/carts/convert/${sellId}/OrderToCart`);
    
    return {
      success: true,
      message: response.data.message,
      cart: response.data.cart,
      originalOrder: response.data.originalOrder,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to convert order to cart");
  }
};

// Context type for optimistic updates
interface ConvertOrderContext {
  previousSells?: GetAllSellsUserResponse;
}

// React Query hook for converting order to cart
export const useConvertOrderToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ConvertOrderResponse,
    Error,
    string, // sellId parameter
    ConvertOrderContext // Context type
  >({
    mutationFn: convertOrderToCart,
    // On successful conversion
    onSuccess: (data, sellId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: sellsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      // You can also update the cache optimistically
      // Remove the sold item from sells list if needed
      queryClient.setQueryData<GetAllSellsUserResponse>(
        sellsKeys.lists(),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            sells: oldData.sells?.filter(sell => sell.id !== sellId) || [],
            count: Math.max(0, (oldData.count || 1) - 1),
          };
        }
      );
    },
    // Optional: onMutate for optimistic updates
    onMutate: async (sellId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: sellsKeys.all });
      
      // Snapshot the previous value
      const previousSells = queryClient.getQueryData<GetAllSellsUserResponse>(sellsKeys.lists());
      
      // Return a context object with the snapshotted value
      return { previousSells };
    },
    // Optional: onError for rollback
    onError: (err, sellId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSells) {
        queryClient.setQueryData(sellsKeys.lists(), context.previousSells);
      }
    },
    // Optional: onSettled for cleanup
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: sellsKeys.all });
    },
  });
};

// Helper hook for getting a single sell
export const useSellDetail = (sellId?: string) => {
  return useQuery({
    queryKey: sellsKeys.detail(sellId || ''),
    queryFn: async () => {
      if (!sellId) throw new Error('No sell ID provided');
      const response = await api.get(`/sells/${sellId}`);
      return response.data;
    },
    enabled: !!sellId, // Only fetch if sellId exists
  });
};

// Export all hooks for convenience
export const sellsHooks = {
  useUserSells,
  useConvertOrderToCart,
  useSellDetail,
};