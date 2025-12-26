import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { 
  getShopsBasedOnUser, 
  getAvailableBatchesByProductAndShop, 
  IShop, 
  IBatch, 
  IBatchesResponse 
} from "@/(services)/api/shopService";

// Async thunk for fetching user shops
export const fetchShopsBasedOnUser = createAsyncThunk(
  "shops/fetchShopsBasedOnUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getShopsBasedOnUser();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user shops");
    }
  }
);

// Async thunk for fetching available batches by product and shop
export const fetchAvailableBatchesByProductAndShop = createAsyncThunk(
  "batches/fetchAvailableBatchesByProductAndShop",
  async ({ shopId, productId }: { shopId: string; productId: string }, { rejectWithValue }) => {
    try {
      const response = await getAvailableBatchesByProductAndShop(shopId, productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch batches");
    }
  }
);

// Define the state interface
interface ShopsState {
  shops: IShop[];
  batches: IBatch[];
  loading: boolean;
  error: string | null;
  batchesCount: number;
  currentShop: IShop | null;
}

const initialState: ShopsState = {
  shops: [],
  batches: [],
  loading: false,
  error: null,
  batchesCount: 0,
  currentShop: null,
};

const shopsSlice = createSlice({
  name: "shops",
  initialState,
  reducers: {
    clearShops: (state) => {
      state.shops = [];
      state.error = null;
    },
    clearBatches: (state) => {
      state.batches = [];
      state.batchesCount = 0;
    },
    clearCurrentShop: (state) => {
      state.currentShop = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentShop: (state, action: PayloadAction<IShop>) => {
      state.currentShop = action.payload;
    },
    // Action to manually update batch quantity (useful for real-time updates)
    updateBatchQuantity: (state, action: PayloadAction<{ batchId: string; quantity: number }>) => {
      const batch = state.batches.find(b => b.id === action.payload.batchId);
      if (batch) {
        batch.quantity = action.payload.quantity;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Shops
      .addCase(fetchShopsBasedOnUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShopsBasedOnUser.fulfilled, (state, action: PayloadAction<IShop[]>) => {
        state.loading = false;
        state.shops = action.payload;
        state.error = null;
        
        // Set first shop as current if none is set
        if (action.payload.length > 0 && !state.currentShop) {
          state.currentShop = action.payload[0];
        }
      })
      .addCase(fetchShopsBasedOnUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.shops = [];
      })
      // Fetch Available Batches
      .addCase(fetchAvailableBatchesByProductAndShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableBatchesByProductAndShop.fulfilled, (state, action: PayloadAction<IBatchesResponse>) => {
        state.loading = false;
        state.batches = action.payload.batches;
        state.batchesCount = action.payload.count;
        state.error = null;
      })
      .addCase(fetchAvailableBatchesByProductAndShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.batches = [];
        state.batchesCount = 0;
      });
  },
});

export const { 
  clearShops, 
  clearBatches, 
  clearCurrentShop, 
  clearError, 
  setCurrentShop,
  updateBatchQuantity
} = shopsSlice.actions;

// Select the entire shops state
const selectShopsState = (state: { shops: ShopsState }) => state.shops;

// Memoized selectors using Redux Toolkit's createSelector
export const selectShops = createSelector(
  [selectShopsState],
  (state) => state.shops
);

export const selectBatches = createSelector(
  [selectShopsState],
  (state) => state.batches
);

export const selectShopsLoading = createSelector(
  [selectShopsState],
  (state) => state.loading
);

export const selectShopsError = createSelector(
  [selectShopsState],
  (state) => state.error
);

export const selectBatchesCount = createSelector(
  [selectShopsState],
  (state) => state.batchesCount
);

export const selectCurrentShop = createSelector(
  [selectShopsState],
  (state) => state.currentShop
);

// Memoized selector for active shops only
export const selectActiveShops = createSelector(
  [selectShops],
  (shops) => shops.filter(shop => shop.isActive !== false)
);

// Memoized selector for batches with available stock
export const selectBatchesWithStock = createSelector(
  [selectBatches],
  (batches) => batches.filter(batch => 
    batch.quantity && batch.quantity > 0
  )
);

// Memoized selector for batches sorted by expiry date (ascending)
export const selectBatchesSortedByExpiry = createSelector(
  [selectBatches],
  (batches) => [...batches].sort((a, b) => 
    new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  )
);

// Memoized selector for batches by specific shop
export const selectBatchesByShopId = (shopId: string) => 
  createSelector(
    [selectBatches],
    (batches) => batches.filter(batch => 
      batch.ShopStock?.some(stock => stock.id === shopId)
    )
  );

// Memoized selector for batches by product ID
export const selectBatchesByProductId = (productId: string) => 
  createSelector(
    [selectBatches],
    (batches) => batches.filter(batch => batch.productId === productId)
  );

// Memoized selector for shop by ID
export const selectShopById = (shopId: string) => 
  createSelector(
    [selectShops],
    (shops) => shops.find(shop => shop.id === shopId)
  );

// Memoized selector for batches that are expiring soon (within 7 days)
export const selectExpiringSoonBatches = createSelector(
  [selectBatches],
  (batches) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return batches.filter(batch => {
      const expiryDate = new Date(batch.expiryDate);
      return expiryDate <= sevenDaysFromNow && expiryDate >= new Date();
    });
  }
);

export default shopsSlice.reducer;