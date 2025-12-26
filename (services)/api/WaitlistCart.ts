import api from "@/(utils)/config";
import { Cart, ProductBatch, Shop, UnitOfMeasure, User } from "./CART";
import { createSelector } from '@reduxjs/toolkit';
import { Branch, Product } from "./topSellingProducts";

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
    errors?: Array<{
      cartItemId: string;
      productName: string;
      error: string;
    }>;
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
    console.error('Error adding to waitlist:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      "Failed to add items to waitlist"
    );
  }
};

/**
 * Helper function to add cart item to waitlist
 * UPDATED: Removed cartId parameter as it's not needed anymore
 */


/**
 * Get current user's waitlists
 * UPDATED: Added proper query parameter handling
 */
export const getMyWaitlists = async (filters?: { startDate?: string; endDate?: string }): Promise<WaitlistsResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add date filters if provided
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/waitlists/my-waitlists?${queryString}` : '/waitlists/my-waitlists';
    
    const response = await api.get(url);
    
    // Return the full response data (which should include count, success, waitlists)
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
 * Remove item from waitlist - NO CHANGES NEEDED
 */
export const removeItemFromWaitlist = async (waitlistItemId: string): Promise<MessageResponse> => {
  try {
    const response = await api.delete(`/waitlists/${waitlistItemId}`);
    
    return {
      success: true,
      message: response.data.message || "Item removed from waitlist successfully",
    };
  } catch (error: any) {
    console.error("Error removing item from waitlist:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to remove item from waitlist");
  }
};

/**
 * Clear entire waitlist for a cart - NO CHANGES NEEDED
 */
export const clearWaitlist = async (cartId: string): Promise<MessageResponse> => {
  try {
    const response = await api.delete(`/waitlists/cart/${cartId}/clear`);
    
    return {
      success: true,
      message: response.data.message || "Waitlist cleared successfully",
    };
  } catch (error: any) {
    console.error("Error clearing waitlist:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to clear waitlist");
  }
};

/**
 * Convert waitlist item to cart item - NO CHANGES NEEDED
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
    console.error("Error converting waitlist to cart:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to convert waitlist to cart");
  }
};

/**
 * DEPRECATED: Helper function to add product to waitlist
 * This function is no longer supported as we now require cartItemId
 * Keeping it for backward compatibility but it will throw an error
 */


// Utility function to check if waitlist state is properly initialized
export const isWaitlistStateInitialized = (state: any): boolean => {
  return state?.waitlist !== undefined;
};

// Debug helper to log waitlist state
export const debugWaitlistState = (state: any) => {
  
};

// NEW: Helper function to check if a cart item can be added to waitlist
export const canAddToWaitlist = (cartItem: CartItem): boolean => {
  return Boolean(
    cartItem &&
    cartItem.id &&
    cartItem.cartId   );
};

// NEW: Helper to get waitlist items by cart ID
export const getWaitlistItemsByCartId = (waitlistItems: WaitlistItem[], cartId: string): WaitlistItem[] => {
  return waitlistItems.filter(item => item.cartId === cartId);
};

