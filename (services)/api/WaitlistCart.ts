import api from "@/(utils)/config";
import { Cart, ProductBatch, Shop, UnitOfMeasure, User } from "./CART";
import { createSelector } from '@reduxjs/toolkit';
import { Branch, Product } from "./topSellingProducts";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export interface CartItem {
  id: string;
  cartId: string;
  shopId: string;
  productId: string;
  unitOfMeasureId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Relations
  shop?: Shop;
  product?: Product;
  batch?: ProductBatch;
  unitOfMeasure?: UnitOfMeasure;
}

// Types for Waitlist (extending existing types)
export interface WaitlistItem {
  quantity: number;
  id: string;
  userId?: string;
  customerId: string; // REQUIRED
  branchId?: string;
  cartId?: string;
  cartItemId?: string;
  note?: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Relations
  user?: User;
  customer?: Customer;
  branch?: Branch;
  cart?: Cart;
  cartItem?: CartItem & {
    product?: Product;
    shop?: Shop;
    unitOfMeasure?: UnitOfMeasure;
  };
  createdBy?: User;
  updatedBy?: User;
}

export interface Customer {
  id: string;
  name: string;
  // Add other customer fields as needed
}

// Response Types for Bulk Operations
export interface BulkWaitlistResponse {
  success: boolean;
  message: string;
  data: {
    totalItems: number;
    successfulItems: number;
    failedItems: number;
    waitlistItems: WaitlistItem[];
    errors?: {
      cartItemId: string;
      productName: string;
      error: string;
    }[];
  };
}

export interface SingleWaitlistResponse {
  success: boolean;
  waitlist: WaitlistItem;
  message: string;
}

// In your API file (where WaitlistsResponse is defined)
export interface WaitlistsResponse {
  count: number; // Add this
  success: boolean;
  waitlists: WaitlistItem[];
  message?: string; // Optional message
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// Request Types - UPDATED for Bulk Support
export interface AddToWaitlistRequest {
  cartItemIds: string[]; // REQUIRED - array of cart item IDs
  note?: string; // Optional note for all items
}

export interface ConvertWaitlistResponse {
  success: boolean;
  cartItems: CartItem;
  cart: Cart;
  message: string;
}

// Waitlist State Interface
export interface WaitlistState {
  loading: boolean;
  error: string | null;
  waitlistItems: WaitlistItem[];
  bulkOperation: {
    loading: boolean;
    error: string | null;
    result: BulkWaitlistResponse['data'] | null;
  };
}

// Safe Selectors to prevent "Cannot read property 'loading' of undefined" errors

/**
 * Safe selector for waitlist state - returns empty object if state is undefined
 */
export const selectWaitlistState = (state: any) => state?.waitlist || {};

/**
 * Safe loading selector - returns false if state is undefined
 */
export const selectWaitlistLoading = createSelector(
  [selectWaitlistState],
  (waitlist: WaitlistState) => waitlist.loading || false
);

/**
 * Safe error selector - returns null if state is undefined
 */
export const selectWaitlistError = createSelector(
  [selectWaitlistState],
  (waitlist: WaitlistState) => waitlist.error || null
);

/**
 * Safe waitlist items selector - returns empty array if state is undefined
 */
export const selectWaitlistItems = createSelector(
  [selectWaitlistState],
  (waitlist: WaitlistState) => waitlist.waitlistItems || []
);

/**
 * Bulk operation selectors
 */
export const selectBulkWaitlistLoading = createSelector(
  [selectWaitlistState],
  (waitlist: WaitlistState) => waitlist.bulkOperation?.loading || false
);

export const selectBulkWaitlistError = createSelector(
  [selectWaitlistState],
  (waitlist: WaitlistState) => waitlist.bulkOperation?.error || null
);

export const selectBulkWaitlistResult = createSelector(
  [selectWaitlistState],
  (waitlist: WaitlistState) => waitlist.bulkOperation?.result || null
);

/**
 * Alternative inline selectors for immediate use in components
 */
export const waitlistSelectors = {
  // Direct selector functions
  loading: (state: any) => state?.waitlist?.loading || false,
  error: (state: any) => state?.waitlist?.error || null,
  items: (state: any) => state?.waitlist?.waitlistItems || [],
  
  // Bulk operation selectors
  bulkLoading: (state: any) => state?.waitlist?.bulkOperation?.loading || false,
  bulkError: (state: any) => state?.waitlist?.bulkOperation?.error || null,
  bulkResult: (state: any) => state?.waitlist?.bulkOperation?.result || null,
  
  // Memoized selectors
  loadingSafe: createSelector(
    [(state: any) => state?.waitlist || {}],
    (waitlist) => waitlist.loading || false
  ),
  itemsSafe: createSelector(
    [(state: any) => state?.waitlist || {}],
    (waitlist) => waitlist.waitlistItems || []
  ),
};

// Initial state for waitlist slice
export const initialWaitlistState: WaitlistState = {
  loading: false,
  error: null,
  waitlistItems: [],
  bulkOperation: {
    loading: false,
    error: null,
    result: null,
  },
};

// Waitlist API Functions - UPDATED FOR BULK SUPPORT

/**
 * Add multiple items to waitlist (bulk operation)
 * REQUIRED: Array of cartItemIds
 */// Add at the top of your existing file

// ✅ FIXED: Simplified query keys - NO FILTERS
export const waitlistKeys = {
  all: ['waitlist'] as const,
  lists: () => [...waitlistKeys.all, 'list'] as const,
  detail: (id: string) => [...waitlistKeys.all, 'detail', id] as const,
  cartItems: (cartId: string) => [...waitlistKeys.all, 'cart', cartId] as const,
};

// Waitlist API Functions with React Query Hooks

/**
 * Add multiple items to waitlist (bulk operation)
 */
export const addItemsToWaitlist = async (waitlistData: AddToWaitlistRequest): Promise<BulkWaitlistResponse> => {
  try {
    // Validate required fields
    if (!waitlistData.cartItemIds || !Array.isArray(waitlistData.cartItemIds)) {
      throw new Error('Valid array of cartItemIds is required');
    }
    
    if (waitlistData.cartItemIds.length === 0) {
      throw new Error('At least one cartItemId is required');
    }
    
    if (waitlistData.cartItemIds.some(id => typeof id !== 'string')) {
      throw new Error('All cartItemIds must be strings');
    }
    
    const response = await api.post("/waitlists", waitlistData);
    
    return {
      success: true,
      message: response.data.message || "Items added to waitlist successfully",
      data: response.data.data || response.data,
    };
  } catch (error: any) {
    // ✅ FIXED: Safe logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error adding to waitlist:', error.message);
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      "Failed to add items to waitlist"
    );
  }
};

/**
 * React Query hook for adding items to waitlist
 */
export const useAddToWaitlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation<BulkWaitlistResponse, AxiosError, AddToWaitlistRequest>({
    mutationFn: addItemsToWaitlist,
    onSuccess: (data) => {
      // ✅ FIXED: Invalidate using the base key
      queryClient.invalidateQueries({ 
        queryKey: waitlistKeys.all 
      });
      
      // If cartId is available, invalidate cart-specific queries
      if (data.data?.waitlistItems?.[0]?.cartId) {
        const cartId = data.data.waitlistItems[0].cartId;
        queryClient.invalidateQueries({ 
          queryKey: waitlistKeys.cartItems(cartId) 
        });
      }
    },
  });
};

/**
 * Get current user's waitlists - NO FILTERS
 */
export const getMyWaitlists = async (): Promise<WaitlistsResponse> => {
  try {
    const response = await api.get("/waitlists/my-waitlists");
    
    // ✅ FIXED: Safe logging
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('[Waitlist API] Response received');
    // }
    // console.log(response.data)
    return {
      count: response.data.count || response.data.waitlists?.length || 0,
      success: response.data.success !== undefined ? response.data.success : true,
      waitlists: response.data.waitlists || response.data || [],
      message: response.data.message
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch waitlists");
  }
};

/**
 * React Query hook for fetching waitlists - NO FILTERS
 */
export const useWaitlists = () => {
  return useQuery<WaitlistsResponse, AxiosError>({
    queryKey: waitlistKeys.lists(),
    queryFn: getMyWaitlists,
    // Only fetch if we have a user/session
    enabled: true, // Set based on your authentication state
    staleTime: 2 * 60 * 1000, // 2 minutes
    
    // ✅ IMPROVEMENT: Add select to reduce re-renders
    select: (data) => ({
      ...data,
      // You can transform data here if needed
    }),
    
    // ✅ IMPROVEMENT: Add keepPreviousData for smooth UX    
    retry: (failureCount, error) => {
      // Don't retry on 404 or 401 errors
      if (error.response?.status === 404 || error.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Remove item from waitlist
 */
export const removeItemFromWaitlist = async (waitlistItemId: string): Promise<MessageResponse> => {
  try {
    const response = await api.delete(`/waitlists/${waitlistItemId}`);
    
    return {
      success: true,
      message: response.data.message || "Item removed from waitlist successfully",
    };
  } catch (error: any) {
    // ✅ FIXED: Safe logging
    if (process.env.NODE_ENV === 'development') {
      console.error("Error removing item from waitlist:", error.message);
    }
    
    throw new Error(error.response?.data?.message || "Failed to remove item from waitlist");
  }
};

/**
 * React Query hook for removing item from waitlist
 */
export const useRemoveFromWaitlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation<MessageResponse, AxiosError, string>({
    mutationFn: removeItemFromWaitlist,
    // ✅ FIXED: OPTION A - Use invalidation only (simpler and safer)
    onSuccess: () => {
      // Invalidate all waitlist queries
      queryClient.invalidateQueries({ 
        queryKey: waitlistKeys.all 
      });
    },
  });
};

/**
 * Clear entire waitlist for a cart
 */
export const clearWaitlist = async (cartId: string): Promise<MessageResponse> => {
  try {
    const response = await api.delete(`/waitlists/cart/${cartId}/clear`);
    
    return {
      success: true,
      message: response.data.message || "Waitlist cleared successfully",
    };
  } catch (error: any) {
    // ✅ FIXED: Safe logging
    if (process.env.NODE_ENV === 'development') {
      console.error("Error clearing waitlist:", error.message);
    }
    
    throw new Error(error.response?.data?.message || "Failed to clear waitlist");
  }
};

/**
 * React Query hook for clearing waitlist
 */
export const useClearWaitlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation<MessageResponse, AxiosError, string>({
    mutationFn: clearWaitlist,
    onSuccess: (data, cartId) => {
      // ✅ FIXED: Invalidate all waitlist queries
      queryClient.invalidateQueries({ 
        queryKey: waitlistKeys.all 
      });
      
      // Also invalidate cart-specific queries
      queryClient.invalidateQueries({ 
        queryKey: waitlistKeys.cartItems(cartId) 
      });
    },
  });
};

/**
 * Convert waitlist item to cart item
 */
export const convertWaitlistToCart = async (customerId: string): Promise<ConvertWaitlistResponse> => {
  try {
    const response = await api.post(`/waitlists/${customerId}/convert-to-cart`);
    
    return {
      success: true,
      cartItems: response.data.cartItem,
      cart: response.data.cart,
      message: response.data.message || "Waitlist item successfully added to cart",
    };
  } catch (error: any) {
    // ✅ FIXED: Safe logging
    if (process.env.NODE_ENV === 'development') {
      console.error("Error converting waitlist to cart:", error.message);
    }
    
    throw new Error(error.response?.data?.message || "Failed to convert waitlist to cart");
  }
};

/**
 * React Query hook for converting waitlist to cart
 */
export const useConvertWaitlistToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ConvertWaitlistResponse, AxiosError, string>({
    mutationFn: convertWaitlistToCart,
    onSuccess: (data, customerId) => {
      // ✅ FIXED: Invalidate all waitlist queries
      queryClient.invalidateQueries({ 
        queryKey: waitlistKeys.all 
      });
      
      // You might also want to invalidate cart queries
      // queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

/**
 * Get waitlist items by cart ID (helper query)
 */
export const getWaitlistItemsByCart = async (cartId: string): Promise<WaitlistItem[]> => {
  try {
    const response = await api.get(`/waitlists/cart/${cartId}`);
    return response.data.waitlists || response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch cart waitlist items");
  }
};

/**
 * React Query hook for fetching waitlist items by cart ID
 */
export const useWaitlistItemsByCart = (cartId: string) => {
  return useQuery<WaitlistItem[], AxiosError>({
    queryKey: waitlistKeys.cartItems(cartId),
    queryFn: () => getWaitlistItemsByCart(cartId),
    enabled: !!cartId,   });
};

// ✅ Create a separate hook for waitlist items only (for components that just need the list)
export const useWaitlistItems = () => {
  return useQuery({
    queryKey: waitlistKeys.lists(),
    queryFn: getMyWaitlists,
    select: (data) => data.waitlists, // Extract only waitlist items
  });
};

// Export all hooks
export const waitlistHooks = {
  useWaitlists,
  useWaitlistItems, // New simplified hook
  useAddToWaitlist,
  useRemoveFromWaitlist,
  useClearWaitlist,
  useConvertWaitlistToCart,
  useWaitlistItemsByCart,
};