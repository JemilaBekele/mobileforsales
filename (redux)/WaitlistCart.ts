import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import {
  addItemsToWaitlist,
  BulkWaitlistResponse
} from "@/(services)/api/WaitlistCart";
import { getMyCart } from "@/(services)/api/CART";
import api from "@/(utils)/config";

// Remove unnecessary imports and keep only what's needed for addItemsToWaitlistAction
export const addItemsToWaitlistAction = createAsyncThunk(
  "waitlist/addItemsToWaitlist",
  async (waitlistData: { customerId?: string; cartItemIds: string[]; note?: string }, { rejectWithValue }) => {
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
          await getMyCart();
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
      const response = await addItemsToWaitlist(payload);
      
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

// Define simplified state interface
interface WaitlistState {
  loading: boolean;
  error: string | null;
  bulkAddLoading: boolean;
  bulkAddError: string | null;
  lastBulkResult: BulkWaitlistResponse['data'] | null;
}

const initialState: WaitlistState = {
  loading: false,
  error: null,
  bulkAddLoading: false,
  bulkAddError: null,
  lastBulkResult: null,
};

const waitlistSlice = createSlice({
  name: "waitlist",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.bulkAddError = null;
    },
    clearBulkResult: (state) => {
      state.lastBulkResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Items To Waitlist (BULK)
      .addCase(addItemsToWaitlistAction.pending, (state) => {
        state.bulkAddLoading = true;
        state.bulkAddError = null;
        state.lastBulkResult = null;
      })
      .addCase(addItemsToWaitlistAction.fulfilled, (state, action: PayloadAction<BulkWaitlistResponse>) => {
        state.bulkAddLoading = false;
        state.lastBulkResult = action.payload.data;
        state.bulkAddError = null;
      })
      .addCase(addItemsToWaitlistAction.rejected, (state, action) => {
        state.bulkAddLoading = false;
        state.bulkAddError = action.payload as string;
        state.lastBulkResult = null;
      });
  },
});

export const {
  clearError,
  clearBulkResult,
} = waitlistSlice.actions;

// Selectors
const selectWaitlistState = (state: { waitlist: WaitlistState }) => state.waitlist;

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

export default waitlistSlice.reducer;