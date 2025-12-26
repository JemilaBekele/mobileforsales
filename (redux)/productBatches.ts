import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { 
  getProductBatchesByShopsForUser, 
  ProductBatchesForUserResponse,
  ShopBatchInfo,
  AdditionalPrice,
  UnitOfMeasure
} from "@/(services)/api/productBatchesService";

// Async thunk for fetching product batches by shops for user
export const fetchProductBatchesByShopsForUser = createAsyncThunk(
  "productBatches/fetchProductBatchesByShopsForUser",
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await getProductBatchesByShopsForUser(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product batches");
    }
  }
);

// Define the state interface
interface ProductBatchesState {
  // Current product batches data
  batchesData: {
    totalAvailableQuantity: number;
    shops: ShopBatchInfo[];
    hasStock: boolean;
    _metadata: {
      totalShops: number;
      accessibleShops: number;
      hasRestrictedAccess: boolean;
      userHasAccess?: boolean;
      message: string;
    };
  } | null;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  
  // Current product ID being viewed
  currentProductId: string | null;
  
  // Selected shop for detailed view
  selectedShopId: string | null;
  
  // Sort and filter preferences
  sortBy: 'quantity' | 'price' | 'name';
  sortOrder: 'asc' | 'desc';
  
  // Cache for multiple products (optional - for performance)
  cachedBatches: {
    [productId: string]: {
      data: any;
      timestamp: number;
    };
  };
}

const initialState: ProductBatchesState = {
  batchesData: null,
  loading: false,
  error: null,
  currentProductId: null,
  selectedShopId: null,
  sortBy: 'quantity',
  sortOrder: 'desc',
  cachedBatches: {},
};

const productBatchesSlice = createSlice({
  name: "productBatches",
  initialState,
  reducers: {
    clearProductBatches: (state) => {
      state.batchesData = null;
      state.error = null;
      state.currentProductId = null;
      state.selectedShopId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedShop: (state, action: PayloadAction<string | null>) => {
      state.selectedShopId = action.payload;
    },
    setSortPreference: (state, action: PayloadAction<{ sortBy: 'quantity' | 'price' | 'name'; sortOrder?: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      if (action.payload.sortOrder) {
        state.sortOrder = action.payload.sortOrder;
      }
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    // Clear cache for a specific product or all products
    clearCache: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload) {
        delete state.cachedBatches[action.payload];
      } else {
        state.cachedBatches = {};
      }
    },
    // Update quantity locally (for optimistic updates)
    updateLocalQuantity: (state, action: PayloadAction<{ shopId: string; quantityChange: number }>) => {
      if (state.batchesData) {
        const shop = state.batchesData.shops.find(s => s.shopId === action.payload.shopId);
        if (shop) {
          shop.quantity += action.payload.quantityChange;
          state.batchesData.totalAvailableQuantity += action.payload.quantityChange;
          state.batchesData.hasStock = state.batchesData.totalAvailableQuantity > 0;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Product Batches by Shops for User
      .addCase(fetchProductBatchesByShopsForUser.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.currentProductId = action.meta.arg;
      })
      .addCase(fetchProductBatchesByShopsForUser.fulfilled, (state, action) => {
        state.loading = false;
        state.batchesData = action.payload.batches;
        state.error = null;
        
        // Cache the data
        if (state.currentProductId) {
          state.cachedBatches[state.currentProductId] = {
            data: action.payload.batches,
            timestamp: Date.now(),
          };
        }
      })
      .addCase(fetchProductBatchesByShopsForUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.batchesData = null;
      });
  },
});

export const { 
  clearProductBatches, 
  clearError, 
  setSelectedShop,
  setSortPreference,
  toggleSortOrder,
  clearCache,
  updateLocalQuantity
} = productBatchesSlice.actions;

// Select the entire productBatches state
const selectProductBatchesState = (state: { productBatches: ProductBatchesState }) => 
  state.productBatches;

// Memoized selectors using Redux Toolkit's createSelector
export const selectProductBatchesData = createSelector(
  [selectProductBatchesState],
  (state) => state.batchesData
);

export const selectProductBatchesLoading = createSelector(
  [selectProductBatchesState],
  (state) => state.loading
);

export const selectProductBatchesError = createSelector(
  [selectProductBatchesState],
  (state) => state.error
);

export const selectCurrentProductId = createSelector(
  [selectProductBatchesState],
  (state) => state.currentProductId
);

export const selectSelectedShopId = createSelector(
  [selectProductBatchesState],
  (state) => state.selectedShopId
);

export const selectSortPreferences = createSelector(
  [selectProductBatchesState],
  (state) => ({ sortBy: state.sortBy, sortOrder: state.sortOrder })
);

// Derived selectors
export const selectShopsWithStock = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?.shops.filter(shop => shop.quantity > 0) || []
);

export const selectShopsWithoutStock = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?.shops.filter(shop => shop.quantity <= 0) || []
);

export const selectTotalAvailableQuantity = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?.totalAvailableQuantity || 0
);

export const selectHasStock = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?.hasStock || false
);

export const selectAccessibleShopsCount = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?._metadata.accessibleShops || 0
);

export const selectTotalShopsCount = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?._metadata.totalShops || 0
);

export const selectHasRestrictedAccess = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?._metadata.hasRestrictedAccess || false
);

export const selectAccessMetadata = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?._metadata
);

// Selected shop details
export const selectSelectedShop = createSelector(
  [selectProductBatchesData, selectSelectedShopId],
  (batchesData, selectedShopId) => {
    if (!batchesData || !selectedShopId) return null;
    return batchesData.shops.find(shop => shop.shopId === selectedShopId) || null;
  }
);

// Sorted shops
export const selectSortedShops = createSelector(
  [selectProductBatchesData, selectSortPreferences],
  (batchesData, sortPreferences) => {
    if (!batchesData) return [];
    
    const shops = [...batchesData.shops];
    
    return shops.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortPreferences.sortBy) {
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'price':
          aValue = a.totalPrice || 0;
          bValue = b.totalPrice || 0;
          break;
        case 'name':
          aValue = a.shopName.toLowerCase();
          bValue = b.shopName.toLowerCase();
          break;
        default:
          aValue = a.quantity;
          bValue = b.quantity;
      }
      
      if (sortPreferences.sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }
);

// Shops with additional prices
export const selectShopsWithAdditionalPrices = createSelector(
  [selectProductBatchesData],
  (batchesData) => batchesData?.shops.filter(shop => 
    shop.additionalPrices && shop.additionalPrices.length > 0
  ) || []
);

// Cheapest shop (lowest total price)
export const selectCheapestShop = createSelector(
  [selectShopsWithStock],
  (shops) => {
    const shopsWithPrice = shops.filter(shop => shop.totalPrice !== null);
    if (shopsWithPrice.length === 0) return null;
    
    return shopsWithPrice.reduce((cheapest, shop) => 
      (shop.totalPrice || Infinity) < (cheapest.totalPrice || Infinity) ? shop : cheapest
    );
  }
);

// Shop with highest quantity
export const selectShopWithHighestQuantity = createSelector(
  [selectShopsWithStock],
  (shops) => {
    if (shops.length === 0) return null;
    
    return shops.reduce((max, shop) => 
      shop.quantity > max.quantity ? shop : max
    );
  }
);

// Group shops by branch
export const selectShopsByBranch = createSelector(
  [selectProductBatchesData],
  (batchesData) => {
    if (!batchesData) return {};
    
    return batchesData.shops.reduce((acc, shop) => {
      const branchName = shop.branchName || 'Unknown Branch';
      if (!acc[branchName]) {
        acc[branchName] = [];
      }
      acc[branchName].push(shop);
      return acc;
    }, {} as { [branchName: string]: ShopBatchInfo[] });
  }
);

// Check if data is cached for a product
export const selectIsCached = (productId: string) => 
  createSelector(
    [selectProductBatchesState],
    (state) => !!state.cachedBatches[productId]
  );

// Get cached data for a product
export const selectCachedData = (productId: string) => 
  createSelector(
    [selectProductBatchesState],
    (state) => state.cachedBatches[productId]?.data || null
  );

export default productBatchesSlice.reducer;