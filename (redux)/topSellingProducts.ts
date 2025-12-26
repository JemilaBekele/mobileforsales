import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { 
  getTopSellingProducts, 
  TopSellingProduct,
  GetTopSellingProductsParams, 
} from "@/(services)/api/topSellingProducts";

// Async thunk for fetching top selling products with optional filters
// In your Redux slice, update the fetchTopSellingProducts thunk
export const fetchTopSellingProducts = createAsyncThunk(
  "topSellingProducts/fetchTopSellingProducts",
  async (params: GetTopSellingProductsParams = {}, { rejectWithValue }) => {
    try {
      const response = await getTopSellingProducts(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch top selling products");
    }
  }
);

// Define the state interface
interface TopSellingProductsState {
  products: TopSellingProduct[];
  loading: boolean;
  error: string | null;
  count: number;
  note?: string;
  // New fields for search and filters
  currentSearchTerm: string | null;
  currentCategoryId: string | null;
  currentSubCategoryId: string | null;
  lastFetchParams: GetTopSellingProductsParams | null;
}

const initialState: TopSellingProductsState = {
  products: [],
  loading: false,
  error: null,
  count: 0,
  note: undefined,
  currentSearchTerm: null,
  currentCategoryId: null,
  currentSubCategoryId: null,
  lastFetchParams: null,
};

const topSellingProductsSlice = createSlice({
  name: "topSellingProducts",
  initialState,
  reducers: {
    clearTopSellingProducts: (state) => {
      state.products = [];
      state.count = 0;
      state.error = null;
      state.note = undefined;
      state.currentSearchTerm = null;
      state.currentCategoryId = null;
      state.currentSubCategoryId = null;
      state.lastFetchParams = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // New reducer to update search and filter state without fetching
    setSearchFilters: (state, action: PayloadAction<GetTopSellingProductsParams>) => {
      if (action.payload.searchTerm !== undefined) {
        state.currentSearchTerm = action.payload.searchTerm;
      }
      if (action.payload.categoryId !== undefined) {
        state.currentCategoryId = action.payload.categoryId;
      }
      if (action.payload.subCategoryId !== undefined) {
        state.currentSubCategoryId = action.payload.subCategoryId;
      }
    },
    // New reducer to clear all filters
    clearFilters: (state) => {
      state.currentSearchTerm = null;
      state.currentCategoryId = null;
      state.currentSubCategoryId = null;
    },
    // New reducer to clear only search term
    clearSearchTerm: (state) => {
      state.currentSearchTerm = null;
    },
    // New reducer to update product stock information (if needed for real-time updates)
    updateProductStock: (state, action: PayloadAction<{ 
      productId: string; 
      // Add any stock-related fields you might need to update
    }>) => {
      // Implementation depends on your specific stock update needs
      // This is a placeholder for potential real-time stock updates
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Top Selling Products
      .addCase(fetchTopSellingProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopSellingProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.count = action.payload.count;
        state.note = action.payload.note;
        state.error = null;
        
        // Store the current search and filter parameters
        if (action.meta.arg) {
          state.lastFetchParams = action.meta.arg;
          state.currentSearchTerm = action.meta.arg.searchTerm || null;
          state.currentCategoryId = action.meta.arg.categoryId || null;
          state.currentSubCategoryId = action.meta.arg.subCategoryId || null;
        }
      })
      .addCase(fetchTopSellingProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.products = [];
        state.count = 0;
        state.note = undefined;
      });
  },
});

export const { 
  clearTopSellingProducts, 
  clearError, 
  setSearchFilters,
  clearFilters,
  clearSearchTerm,
  updateProductStock
} = topSellingProductsSlice.actions;

// Select the entire topSellingProducts state
const selectTopSellingProductsState = (state: { topSellingProducts: TopSellingProductsState }) => 
  state.topSellingProducts;

// Memoized selectors using Redux Toolkit's createSelector
export const selectTopSellingProducts = createSelector(
  [selectTopSellingProductsState],
  (state) => state.products
);

export const selectTopSellingProductsLoading = createSelector(
  [selectTopSellingProductsState],
  (state) => state.loading
);

export const selectTopSellingProductsError = createSelector(
  [selectTopSellingProductsState],
  (state) => state.error
);

export const selectTopSellingProductsCount = createSelector(
  [selectTopSellingProductsState],
  (state) => state.count
);

export const selectTopSellingProductsNote = createSelector(
  [selectTopSellingProductsState],
  (state) => state.note
);

// New selectors for search and filter state
export const selectCurrentSearchTerm = createSelector(
  [selectTopSellingProductsState],
  (state) => state.currentSearchTerm
);

export const selectCurrentCategoryId = createSelector(
  [selectTopSellingProductsState],
  (state) => state.currentCategoryId
);

export const selectCurrentSubCategoryId = createSelector(
  [selectTopSellingProductsState],
  (state) => state.currentSubCategoryId
);

export const selectLastFetchParams = createSelector(
  [selectTopSellingProductsState],
  (state) => state.lastFetchParams
);

export const selectHasActiveFilters = createSelector(
  [selectCurrentSearchTerm, selectCurrentCategoryId, selectCurrentSubCategoryId],
  (searchTerm, categoryId, subCategoryId) => 
    !!(searchTerm || categoryId || subCategoryId)
);


// Memoized selector for products by category
export const selectTopSellingProductsByCategory = (categoryId: string) => 
  createSelector(
    [selectTopSellingProducts],
    (products) => products.filter(product => product.product.category.id === categoryId)
  );

// Memoized selector for specific product by ID
export const selectTopSellingProductById = (productId: string) => 
  createSelector(
    [selectTopSellingProducts],
    (products) => products.find(product => product.product.id === productId)
  );

// Memoized selector for searched products (client-side search as fallback)
export const selectSearchedTopSellingProducts = (searchTerm: string) => 
  createSelector(
    [selectTopSellingProducts],
    (products) => {
      if (!searchTerm.trim()) return products;
      
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      return products.filter(product => 
        product.product.name.toLowerCase().includes(lowercasedSearchTerm) ||
        product.product.generic?.toLowerCase().includes(lowercasedSearchTerm) ||
        product.product.productCode.toLowerCase().includes(lowercasedSearchTerm) ||
        product.product.description?.toLowerCase().includes(lowercasedSearchTerm)
      );
    }
  );

// Memoized selector for products with additional prices
export const selectProductsWithAdditionalPrices = createSelector(
  [selectTopSellingProducts],
  (products) => products.filter(product => 
    product.product.additionalPrices && product.product.additionalPrices.length > 0
  )
);

export default topSellingProductsSlice.reducer;