import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import {
  addItemsToWaitlist,
  getMyWaitlists,
  removeItemFromWaitlist,
  clearWaitlist,
  convertWaitlistToCart,
  WaitlistsResponse,
  MessageResponse,
  ConvertWaitlistResponse as ApiConvertWaitlistResponse,
  WaitlistItem,
  AddToWaitlistRequest,
  WaitlistState as ApiWaitlistState,
  initialWaitlistState,
  BulkWaitlistResponse
} from "@/(services)/api/WaitlistCart";
import { getMyCart } from "@/(services)/api/CART";
import api from "@/(utils)/config";
import { Customer } from "@/(services)/api/customer";

// Update the ConvertWaitlistResponse interface to match new backend response
interface ConvertWaitlistResponse {
  success: boolean;
  cartItems?: any[]; // Changed from cartItem (single) to cartItems (array)
  cart?: any;
  customer?: any;
  message?: string;
  totalItemsConverted?: number;
}

export const addItemsToWaitlistAction = createAsyncThunk(
  "waitlist/addItemsToWaitlist",
  async (waitlistData: AddToWaitlistRequest & { customerId?: string }, { rejectWithValue, dispatch }) => {
    try {
      
      // First get current cart
      const cartResponse = await getMyCart();
      if (!cartResponse.cart) {
        throw new Error("No active cart found");
      }
      
      const cartId = cartResponse.cart.id;
      const { customerId, cartItemIds, note } = waitlistData;
      
  
      
      // 1. FIRST assign customer to cart if not already assigned AND customerId is provided
      if (!cartResponse.cart.customerId && customerId) {
        try {
          await api.put(`/carts/assign/customer/${cartId}`, { 
            customerId 
          });
          
          // Wait a moment for the update to propagate
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Refresh cart to get updated customerId
          const updatedCart = await getMyCart();
          
        } catch (assignError: any) {
          if (assignError.response) {
            console.error('Response status:', assignError.response.status);
            console.error('Response data:', assignError.response.data);
          }
          throw new Error(`Failed to assign customer to cart: ${assignError.message}`);
        }
      }
      
      // 2. Validate cart has customer after assignment attempt
      const finalCart = await getMyCart();
      const finalCustomerId = finalCart.cart?.customerId || customerId;
      
      if (!finalCustomerId) {
        throw new Error("Cart must have a customer assigned before adding items to waitlist");
      }
      
      
      // 3. NOW proceed with adding items to waitlist WITH customerId
      const payload = { 
        cartItemIds, 
        note,
        customerId: finalCustomerId
      };
      const response = await addItemsToWaitlist(payload as unknown as AddToWaitlistRequest);
      
    
      
      return response;
    } catch (error: any) {
      console.error('❌ Failed to add items to waitlist:', error.message);
      
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      
      return rejectWithValue(error.message || "Failed to add items to waitlist");
    }
  }
);

// Async thunks
export const fetchMyWaitlists = createAsyncThunk(
  "waitlist/fetchMyWaitlists",
  async (filters?: { startDate?: string; endDate?: string }) => {
    try {
      const response = await getMyWaitlists(filters);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch waitlists");
    }
  }
);

export const removeWaitlistItem = createAsyncThunk(
  "waitlist/removeWaitlistItem",
  async (waitlistItemId: string, { rejectWithValue }) => {
    try {
      const response = await removeItemFromWaitlist(waitlistItemId);
      return { ...response, waitlistItemId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove item from waitlist");
    }
  }
);

export const clearWaitlistAction = createAsyncThunk(
  "waitlist/clearWaitlist",
  async (cartId: string, { rejectWithValue }) => {
    try {
      const response = await clearWaitlist(cartId);
      return { ...response, cartId };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to clear waitlist");
    }
  }
);

export const convertWaitlistToCartAction = createAsyncThunk<
  ConvertWaitlistResponse & { customerId: string; cartItems: any[] },
  string,
  { rejectValue: string }
>(
  "waitlist/convertWaitlistToCart",
  async (customerId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await convertWaitlistToCart(customerId);
      return {
        ...response,
        customerId,
        // Ensure we have cartItems array
        cartItems: (response as any).cartItems || []
      } as ConvertWaitlistResponse & { customerId: string; cartItems: any[] };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to convert waitlist to cart");
    }
  }
);

interface WaitlistResponseType {
  count: number;
  success: boolean;
  waitlists: WaitlistItem[];
  message?: string;
}

// Define the state interface - Updated to match API's WaitlistState with bulk operations
interface WaitlistState extends Omit<ApiWaitlistState, 'waitlistItems'> {
  waitlistItems: WaitlistItem[];
  waitlistResponse: WaitlistResponseType | null; // Use the correct type
  lastAction: string | null;
  conversionLoading: boolean;
  conversionError: string | null;
  filters: {
    startDate?: string;
    endDate?: string;
  };
  bulkAddLoading: boolean;
  bulkAddError: string | null;
  lastBulkResult: BulkWaitlistResponse['data'] | null;
  customerId: string | null;
  customerData: Customer | null;
// Add new state for bulk conversion
  lastConversionResult: {
    success: boolean;
    totalConverted: number;
    customer?: any;
    cart?: any;
    message?: string;
  } | null;
}

// Use initialWaitlistState from API as base and extend it
const initialState: WaitlistState = {
  ...initialWaitlistState,
  waitlistItems: initialWaitlistState.waitlistItems,
  waitlistResponse: null, // Add this to store the full response
  lastAction: null,
    customerId: null,
  customerData: null,
  conversionLoading: false,
  conversionError: null,
  filters: {},
  bulkAddLoading: false,
  bulkAddError: null,
  lastBulkResult: null,
  lastConversionResult: null,
};

const waitlistSlice = createSlice({
  name: "waitlist",
  initialState,
  reducers: {
    clearWaitlists: (state) => {
      state.waitlistItems = [];
      state.waitlistResponse = null; // Clear response too
      state.error = null;
      state.lastAction = null;
      state.conversionError = null;
      state.bulkAddError = null;
      state.lastBulkResult = null;
      state.lastConversionResult = null;
    },
    clearError: (state) => {
      state.error = null;
      state.conversionError = null;
      state.bulkAddError = null;
    },
    clearLastAction: (state) => {
      state.lastAction = null;
    },
    setFilters: (state, action: PayloadAction<{ startDate?: string; endDate?: string }>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearBulkResult: (state) => {
      state.lastBulkResult = null;
    },
    clearConversionResult: (state) => {
      state.lastConversionResult = null;
    },
    // Optimistic updates for better UX
    removeWaitlistItemOptimistic: (state, action: PayloadAction<string>) => {
      state.waitlistItems = state.waitlistItems.filter(item => item.id !== action.payload);
      // Also update the response object if it exists
      if (state.waitlistResponse) {
        state.waitlistResponse.waitlists = state.waitlistResponse.waitlists.filter(item => item.id !== action.payload);
        state.waitlistResponse.count = state.waitlistResponse.waitlists.length;
      }
    },
    addWaitlistItemsOptimistic: (state, action: PayloadAction<WaitlistItem[]>) => {
      // Add new waitlist items to the beginning of the list
      state.waitlistItems.unshift(...action.payload);
      // Also update the response object if it exists
      if (state.waitlistResponse) {
        state.waitlistResponse.waitlists.unshift(...action.payload);
        state.waitlistResponse.count = state.waitlistResponse.waitlists.length;
      }
    },
    setConversionLoading: (state, action: PayloadAction<boolean>) => {
      state.conversionLoading = action.payload;
    },
    // Optimistic update for converting waitlist
    convertWaitlistToCartOptimistic: (state, action: PayloadAction<string>) => {
      // Remove all waitlist items for this customer optimistically
      state.waitlistItems = state.waitlistItems.filter(item => item.customerId !== action.payload);
      if (state.waitlistResponse) {
        state.waitlistResponse.waitlists = state.waitlistResponse.waitlists.filter(
          item => item.customerId !== action.payload
        );
        state.waitlistResponse.count = state.waitlistResponse.waitlists.length;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Waitlists
      .addCase(fetchMyWaitlists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyWaitlists.fulfilled, (state, action: PayloadAction<WaitlistsResponse>) => {
        state.loading = false;
        // Store the full response
        state.waitlistResponse = action.payload;
        // Extract waitlists array for backward compatibility
        state.waitlistItems = action.payload.waitlists || [];
        state.error = null;
        state.lastAction = "fetch";
      })
      .addCase(fetchMyWaitlists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch waitlists";
      })
      // Add Items To Waitlist (BULK)
      .addCase(addItemsToWaitlistAction.pending, (state) => {
        state.bulkAddLoading = true;
        state.bulkAddError = null;
        state.lastBulkResult = null;
      })
      .addCase(addItemsToWaitlistAction.fulfilled, (state, action: PayloadAction<BulkWaitlistResponse>) => {
        state.bulkAddLoading = false;
        
        // Store bulk operation result
        state.lastBulkResult = action.payload.data;
        
        // Add successful waitlist items to state
        if (action.payload.data.waitlistItems && action.payload.data.waitlistItems.length > 0) {
          // Remove any existing waitlist items that might have been updated
          const updatedIds = action.payload.data.waitlistItems.map(item => item.id);
          state.waitlistItems = state.waitlistItems.filter(item => !updatedIds.includes(item.id));
          
          // Add new waitlist items to the beginning
          state.waitlistItems.unshift(...action.payload.data.waitlistItems);
          
          // Also update the response object if it exists
          if (state.waitlistResponse) {
            state.waitlistResponse.waitlists = state.waitlistResponse.waitlists.filter(item => !updatedIds.includes(item.id));
            state.waitlistResponse.waitlists.unshift(...action.payload.data.waitlistItems);
            state.waitlistResponse.count = state.waitlistResponse.waitlists.length;
          }
        }
        
        state.bulkAddError = null;
        state.lastAction = "addItemsBulk";
      })
      .addCase(addItemsToWaitlistAction.rejected, (state, action) => {
        state.bulkAddLoading = false;
        state.bulkAddError = action.payload as string;
        state.lastBulkResult = null;
      })
      // Remove Waitlist Item
      .addCase(removeWaitlistItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeWaitlistItem.fulfilled, (state, action: PayloadAction<MessageResponse & { waitlistItemId: string }>) => {
        state.loading = false;
        // Remove the item from state
        state.waitlistItems = state.waitlistItems.filter(item => item.id !== action.payload.waitlistItemId);
        // Also update the response object if it exists
        if (state.waitlistResponse) {
          state.waitlistResponse.waitlists = state.waitlistResponse.waitlists.filter(item => item.id !== action.payload.waitlistItemId);
          state.waitlistResponse.count = state.waitlistResponse.waitlists.length;
        }
        state.error = null;
        state.lastAction = "removeItem";
      })
      .addCase(removeWaitlistItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Clear Waitlist
      .addCase(clearWaitlistAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWaitlistAction.fulfilled, (state, action: PayloadAction<MessageResponse & { cartId: string }>) => {
        state.loading = false;
        // Remove all waitlist items for the specified cart
        state.waitlistItems = state.waitlistItems.filter(item => item.cartId !== action.payload.cartId);
        // Also update the response object if it exists
        if (state.waitlistResponse) {
          state.waitlistResponse.waitlists = state.waitlistResponse.waitlists.filter(item => item.cartId !== action.payload.cartId);
          state.waitlistResponse.count = state.waitlistResponse.waitlists.length;
        }
        state.error = null;
        state.lastAction = "clear";
      })
      .addCase(clearWaitlistAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Convert Waitlist To Cart - UPDATED for bulk conversion
     .addCase(convertWaitlistToCartAction.pending, (state) => {
  state.conversionLoading = true;
  state.conversionError = null;
  state.lastConversionResult = null;
})
.addCase(convertWaitlistToCartAction.fulfilled, (
  state, 
  action: PayloadAction<ConvertWaitlistResponse & { 
    customerId: string;
    cartItems: any[];
  }>
) => {
  state.conversionLoading = false;
  
  // Set the customer ID when conversion is successful
  state.customerId = action.payload.customerId;
  
  // Store the conversion result
  state.lastConversionResult = {
    success: action.payload.success,
    totalConverted: action.payload.totalItemsConverted || action.payload.cartItems?.length || 0,
    customer: action.payload.customer,
    cart: action.payload.cart,
    message: action.payload.message,
  };
  
  // Also set customer data if available in response
  if (action.payload.customer) {
    state.customerData = {
      id: action.payload.customer.id,
      name: action.payload.customer.name,
      phone1: action.payload.customer.phone1,
      companyName: action.payload.customer.companyName,
      tinNumber: action.payload.customer.tinNumber,
      // Add other customer properties you need
    };
  }
  
  // Remove waitlist items for this customer from state
  state.waitlistItems = state.waitlistItems.filter(
    item => item.customerId !== action.payload.customerId
  );
  
  // Also update the response object if it exists
  if (state.waitlistResponse) {
    state.waitlistResponse.waitlists = state.waitlistResponse.waitlists.filter(
      item => item.customerId !== action.payload.customerId
    );
    state.waitlistResponse.count = state.waitlistResponse.waitlists.length;
  }
  
  state.conversionError = null;
  state.lastAction = "convertToCart";
})
.addCase(convertWaitlistToCartAction.rejected, (state, action) => {
  state.conversionLoading = false;
  state.conversionError = action.payload as string;
  state.lastConversionResult = {
    success: false,
    totalConverted: 0,
    message: action.payload as string,
  };
});
  },
});

export const {
  clearWaitlists,
  clearError,
  clearLastAction,
  setFilters,
  clearFilters,
  clearBulkResult,
  clearConversionResult,
  removeWaitlistItemOptimistic,
  addWaitlistItemsOptimistic,
  setConversionLoading,
  convertWaitlistToCartOptimistic,
} = waitlistSlice.actions;

// Selectors
const selectWaitlistState = (state: { waitlist: WaitlistState }) => state.waitlist;

export const selectWaitlistItems = createSelector(
  [selectWaitlistState],
  (state) => state.waitlistItems
);

export const selectWaitlistResponse = createSelector(
  [selectWaitlistState],
  (state) => state.waitlistResponse
);

export const selectWaitlistLoading = createSelector(
  [selectWaitlistState],
  (state) => state.loading
);

export const selectWaitlistError = createSelector(
  [selectWaitlistState],
  (state) => state.error
);

export const selectLastAction = createSelector(
  [selectWaitlistState],
  (state) => state.lastAction
);

export const selectConversionLoading = createSelector(
  [selectWaitlistState],
  (state) => state.conversionLoading
);

export const selectConversionError = createSelector(
  [selectWaitlistState],
  (state) => state.conversionError
);

export const selectWaitlistFilters = createSelector(
  [selectWaitlistState],
  (state) => state.filters
);

export const selectBulkAddLoading = createSelector(
  [selectWaitlistState],
  (state) => state.bulkAddLoading
);

export const selectBulkAddError = createSelector(
  [selectWaitlistState],
  (state) => state.bulkAddError
);

export const selectLastBulkResult = createSelector(
  [selectWaitlistState],
  (state) => state.lastBulkResult
);

export const selectWaitlistItemCount = createSelector(
  [selectWaitlistItems],
  (waitlistItems) => waitlistItems.length
);

export const selectWaitlistItemById = (waitlistItemId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.find(item => item.id === waitlistItemId)
  );

export const selectWaitlistsByCart = (cartId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.filter(item => item.cartId === cartId)
  );

export const selectWaitlistsByProduct = (productId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.filter(item => item.cartItem?.productId === productId)
  );

export const selectWaitlistsByCustomer = (customerId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.filter(item => item.customerId === customerId)
  );

export const selectIsProductInWaitlist = (productId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.some(item => item.cartItem?.productId === productId)
  );

export const selectWaitlistsWithCartItems = createSelector(
  [selectWaitlistItems],
  (waitlistItems) => waitlistItems.filter(item => item.cartItemId !== null && item.cartItemId !== undefined)
);

export const selectFilteredWaitlists = createSelector(
  [selectWaitlistItems, selectWaitlistFilters],
  (waitlistItems, filters) => {
    let filtered = waitlistItems;

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(item => {
        if (!item.createdAt) return false;
        return new Date(item.createdAt) >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of the day
      filtered = filtered.filter(item => {
        if (!item.createdAt) return false;
        return new Date(item.createdAt) <= endDate;
      });
    }

    return filtered;
  }
);

export const selectWaitlistsGroupedByCart = createSelector(
  [selectWaitlistItems],
  (waitlistItems) => {
    const grouped: { [cartId: string]: WaitlistItem[] } = {};
    
    waitlistItems.forEach(item => {
      if (item.cartId) {
        if (!grouped[item.cartId]) {
          grouped[item.cartId] = [];
        }
        grouped[item.cartId].push(item);
      }
    });
    
    return grouped;
  }
);

export const selectWaitlistsGroupedByProduct = createSelector(
  [selectWaitlistItems],
  (waitlistItems) => {
    const grouped: { [productId: string]: WaitlistItem[] } = {};
    
    waitlistItems.forEach(item => {
      const productId = item.cartItem?.productId;
      if (productId) {
        if (!grouped[productId]) {
          grouped[productId] = [];
        }
        grouped[productId].push(item);
      }
    });
    
    return grouped;
  }
);

export const selectIsWaitlistEmpty = createSelector(
  [selectWaitlistItems],
  (waitlistItems) => waitlistItems.length === 0
);

export const selectRecentWaitlists = (count: number = 5) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => 
      [...waitlistItems]
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, count)
  );

// Bulk operation selectors
export const selectBulkOperationSuccessCount = createSelector(
  [selectLastBulkResult],
  (result) => result?.successfulItems || 0
);

export const selectBulkOperationFailureCount = createSelector(
  [selectLastBulkResult],
  (result) => result?.failedItems || 0
);

export const selectBulkOperationErrors = createSelector(
  [selectLastBulkResult],
  (result) => result?.errors || []
);

// Additional helper selectors for backward compatibility
export const selectWaitlists = selectWaitlistItems; // Alias for backward compatibility

// New selector to get the full response metadata
export const selectWaitlistMetadata = createSelector(
  [selectWaitlistResponse],
  (response) => ({
    count: response?.count || 0,
    success: response?.success || false,
    hasData: response?.waitlists && response.waitlists.length > 0
  })
);

// Add new selectors for conversion results
export const selectLastConversionResult = createSelector(
  [selectWaitlistState],
  (state) => state.lastConversionResult
);

export const selectConversionSuccess = createSelector(
  [selectLastConversionResult],
  (result) => result?.success || false
);

export const selectTotalConvertedItems = createSelector(
  [selectLastConversionResult],
  (result) => result?.totalConverted || 0
);

export const selectConvertedCustomer = createSelector(
  [selectLastConversionResult],
  (result) => result?.customer
);

export const selectConversionMessage = createSelector(
  [selectLastConversionResult],
  (result) => result?.message
);

// Helper to get waitlist items by customer (for UI display before conversion)
export const selectWaitlistItemsByCustomer = (customerId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.filter(item => item.customerId === customerId)
  );

export const selectWaitlistCountByCustomer = (customerId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.filter(item => item.customerId === customerId).length
  );

// Selector to check if a customer has waitlist items
export const selectCustomerHasWaitlistItems = (customerId: string) =>
  createSelector(
    [selectWaitlistItems],
    (waitlistItems) => waitlistItems.some(item => item.customerId === customerId)
  );

export default waitlistSlice.reducer;