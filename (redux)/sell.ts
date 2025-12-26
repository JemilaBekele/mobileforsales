import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { convertOrderToCart, getAllSellsUser } from "@/(services)/api/sell";
import { GetAllSellsUserParams, Sell, SellItem, ItemSaleStatus, SaleStatus } from "@/(utils)/types";

// Async thunk for fetching user sells
export const fetchUserSells = createAsyncThunk(
  "userSells/fetchUserSells",
  async (params: GetAllSellsUserParams, { rejectWithValue }) => {
    try {
      const response = await getAllSellsUser(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user sells");
    }
  }
);

// Async thunk for converting order to cart
export const convertSellToCart = createAsyncThunk(
  "userSells/convertSellToCart",
  async (sellId: string, { rejectWithValue }) => {
    try {
      const response = await convertOrderToCart(sellId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to convert order to cart");
    }
  }
);

// Define the state interface
interface UserSellsState {
  sells: Sell[];
  loading: boolean;
  error: string | null;
  count: number;
  meta?: {
    dateRange?: {
      requestedStart?: string;
      requestedEnd?: string;
      actualCount: number;
    };
    filters?: {
      customerId?: string | number;
      status?: string;
    };
  };
  filters: {
    startDate?: string;
    endDate?: string;
    customerId?: string | number;
    status?: string;
    saleStatus?: SaleStatus;
    itemSaleStatus?: ItemSaleStatus;
  };
  lastFetchParams?: GetAllSellsUserParams;
  convertingOrderIds: string[];
  conversionErrors: Record<string, string>;
}

const initialState: UserSellsState = {
  sells: [],
  loading: false,
  error: null,
  count: 0,
  meta: undefined,
  filters: {},
  lastFetchParams: undefined,
  convertingOrderIds: [],
  conversionErrors: {},
};

const userSellsSlice = createSlice({
  name: "userSells",
  initialState,
  reducers: {
    clearUserSells: (state) => {
      state.sells = [];
      state.count = 0;
      state.error = null;
      state.meta = undefined;
      state.filters = {};
      state.lastFetchParams = undefined;
      state.convertingOrderIds = [];
      state.conversionErrors = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    updateFilters: (state, action: PayloadAction<Partial<UserSellsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCustomerFilter: (state, action: PayloadAction<string | number | undefined>) => {
      state.filters.customerId = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.status = action.payload;
    },
    setDateRangeFilter: (state, action: PayloadAction<{ startDate?: string; endDate?: string }>) => {
      if (action.payload.startDate !== undefined) {
        state.filters.startDate = action.payload.startDate;
      }
      if (action.payload.endDate !== undefined) {
        state.filters.endDate = action.payload.endDate;
      }
    },
    // Update sell status (useful for real-time updates)
    updateSellStatus: (state, action: PayloadAction<{ sellId: string; saleStatus: SaleStatus }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell) {
        sell.saleStatus = action.payload.saleStatus;
      }
    },
    // Update item status
    updateSellItemStatus: (state, action: PayloadAction<{ 
      sellId: string; 
      itemId: string; 
      itemSaleStatus: ItemSaleStatus;
    }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell && sell.items) {
        const item = sell.items.find(i => i.id === action.payload.itemId);
        if (item) {
          item.itemSaleStatus = action.payload.itemSaleStatus;
        }
      }
    },
    // Update item batches (for tracking batch allocations)
    updateSellItemBatches: (state, action: PayloadAction<{
      sellId: string;
      itemId: string;
      batches: SellItem['batches'];
    }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell && sell.items) {
        const item = sell.items.find(i => i.id === action.payload.itemId);
        if (item) {
          item.batches = action.payload.batches;
        }
      }
    },
    // Add batch to sell item
    addBatchToSellItem: (state, action: PayloadAction<{
      sellId: string;
      itemId: string;
      batch: SellItem['batches'][0];
    }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell && sell.items) {
        const item = sell.items.find(i => i.id === action.payload.itemId);
        if (item) {
          if (!item.batches) {
            item.batches = [];
          }
          item.batches.push(action.payload.batch);
        }
      }
    },
    // Update batch quantity in sell item
    updateSellItemBatchQuantity: (state, action: PayloadAction<{
      sellId: string;
      itemId: string;
      batchId: string;
      quantity: number;
    }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell && sell.items) {
        const item = sell.items.find(i => i.id === action.payload.itemId);
        if (item && item.batches) {
          const batch = item.batches.find(b => b.batchId === action.payload.batchId);
          if (batch) {
            batch.quantity = action.payload.quantity;
          }
        }
      }
    },
    // Add a new sell (for real-time creation)
    addSell: (state, action: PayloadAction<Sell>) => {
      state.sells.unshift(action.payload);
      state.count += 1;
    },
    // Remove a sell (for conversion to cart)
    removeSell: (state, action: PayloadAction<string>) => {
      state.sells = state.sells.filter(sell => sell.id !== action.payload);
      state.count = Math.max(0, state.count - 1);
    },
    // Update sell totals
    updateSellTotals: (state, action: PayloadAction<{ 
      sellId: string; 
      subTotal?: number;
      discount?: number;
      vat?: number;
      grandTotal?: number;
      netTotal?: number;
      totalProducts?: number;
    }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell) {
        if (action.payload.subTotal !== undefined) sell.subTotal = action.payload.subTotal;
        if (action.payload.discount !== undefined) sell.discount = action.payload.discount;
        if (action.payload.vat !== undefined) sell.vat = action.payload.vat;
        if (action.payload.grandTotal !== undefined) sell.grandTotal = action.payload.grandTotal;
        if (action.payload.netTotal !== undefined) sell.NetTotal = action.payload.netTotal;
        if (action.payload.totalProducts !== undefined) sell.totalProducts = action.payload.totalProducts;
      }
    },
    // Update sell item price and totals
    updateSellItemPrice: (state, action: PayloadAction<{
      sellId: string;
      itemId: string;
      unitPrice: number;
      totalPrice: number;
    }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell && sell.items) {
        const item = sell.items.find(i => i.id === action.payload.itemId);
        if (item) {
          item.unitPrice = action.payload.unitPrice;
          item.totalPrice = action.payload.totalPrice;
        }
      }
    },
    // Update sell item quantity
    updateSellItemQuantity: (state, action: PayloadAction<{
      sellId: string;
      itemId: string;
      quantity: number;
      totalPrice: number;
    }>) => {
      const sell = state.sells.find(s => s.id === action.payload.sellId);
      if (sell && sell.items) {
        const item = sell.items.find(i => i.id === action.payload.itemId);
        if (item) {
          item.quantity = action.payload.quantity;
          item.totalPrice = action.payload.totalPrice;
        }
      }
    },
    // Clear conversion error for a specific sell
    clearConversionError: (state, action: PayloadAction<string>) => {
      delete state.conversionErrors[action.payload];
    },
    // Clear all conversion errors
    clearAllConversionErrors: (state) => {
      state.conversionErrors = {};
    },
    // Mark sell as being converted
    markSellAsConverting: (state, action: PayloadAction<string>) => {
      if (!state.convertingOrderIds.includes(action.payload)) {
        state.convertingOrderIds.push(action.payload);
      }
      delete state.conversionErrors[action.payload];
    },
    // Unmark sell as converting
    unmarkSellAsConverting: (state, action: PayloadAction<string>) => {
      state.convertingOrderIds = state.convertingOrderIds.filter(id => id !== action.payload);
    },
    // Apply current filters to refetch
    refetchWithCurrentFilters: (state) => {
      if (state.lastFetchParams) {
        state.loading = true;
        state.error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserSells.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSells.fulfilled, (state, action: ReturnType<typeof fetchUserSells.fulfilled>) => {
        state.loading = false;
        state.sells = action.payload.sells;
        state.count = action.payload.count;
        state.meta = action.payload.meta;
        state.error = null;
        state.lastFetchParams = action.meta.arg;
        // Sync filters with what was actually fetched
        if (action.meta.arg) {
          state.filters = {
            ...state.filters,
            startDate: action.meta.arg.startDate,
            endDate: action.meta.arg.endDate,
            customerId: action.meta.arg.customerId,
            status: action.meta.arg.status,
          };
        }
      })
      .addCase(fetchUserSells.rejected, (state, action: ReturnType<typeof fetchUserSells.rejected>) => {
        state.loading = false;
        state.error = action.payload as string;
        state.sells = [];
        state.count = 0;
        state.meta = undefined;
      })
      
      .addCase(convertSellToCart.pending, (state, action) => {
        const sellId = action.meta.arg;
        if (!state.convertingOrderIds.includes(sellId)) {
          state.convertingOrderIds.push(sellId);
        }
        delete state.conversionErrors[sellId];
      })
      .addCase(convertSellToCart.fulfilled, (state, action: ReturnType<typeof convertSellToCart.fulfilled>) => {
        const { originalOrder } = action.payload;
        const sellId = originalOrder?.invoiceNo ? 
          state.sells.find(s => s.invoiceNo === originalOrder.invoiceNo)?.id || 
          action.meta.arg : action.meta.arg;
        
        state.sells = state.sells.filter(sell => {
          if (originalOrder?.invoiceNo && sell.invoiceNo === originalOrder.invoiceNo) {
            return false;
          }
          return sell.id !== sellId;
        });
        state.count = Math.max(0, state.count - 1);
        
        state.convertingOrderIds = state.convertingOrderIds.filter(id => id !== sellId);
      })
      .addCase(convertSellToCart.rejected, (state, action: ReturnType<typeof convertSellToCart.rejected>) => {
        const sellId = action.meta.arg;
        state.convertingOrderIds = state.convertingOrderIds.filter(id => id !== sellId);
        state.conversionErrors[sellId] = action.payload as string;
      });
  },
});

export const { 
  clearUserSells, 
  clearError, 
  updateFilters,
  clearFilters,
  setCustomerFilter,
  setStatusFilter,
  setDateRangeFilter,
  updateSellStatus,
  updateSellItemStatus,
  updateSellItemBatches,
  addBatchToSellItem,
  updateSellItemBatchQuantity,
  addSell,
  removeSell,
  updateSellTotals,
  updateSellItemPrice,
  updateSellItemQuantity,
  clearConversionError,
  clearAllConversionErrors,
  markSellAsConverting,
  unmarkSellAsConverting,
  refetchWithCurrentFilters
} = userSellsSlice.actions;

// Select the entire userSells state
const selectUserSellsState = (state: { userSells: UserSellsState }) => 
  state.userSells;

// Memoized selectors using Redux Toolkit's createSelector
export const selectUserSells = createSelector(
  [selectUserSellsState],
  (state) => state.sells
);

export const selectUserSellsLoading = createSelector(
  [selectUserSellsState],
  (state) => state.loading
);

export const selectUserSellsError = createSelector(
  [selectUserSellsState],
  (state) => state.error
);

export const selectUserSellsCount = createSelector(
  [selectUserSellsState],
  (state) => state.count
);

export const selectUserSellsMeta = createSelector(
  [selectUserSellsState],
  (state) => state.meta
);

export const selectUserSellsFilters = createSelector(
  [selectUserSellsState],
  (state) => state.filters
);

export const selectLastFetchParams = createSelector(
  [selectUserSellsState],
  (state) => state.lastFetchParams
);

// New selectors for conversion state
export const selectConvertingOrderIds = createSelector(
  [selectUserSellsState],
  (state) => state.convertingOrderIds
);

export const selectConversionErrors = createSelector(
  [selectUserSellsState],
  (state) => state.conversionErrors
);

// Filtered selectors based on current filters
export const selectFilteredUserSells = createSelector(
  [selectUserSells, selectUserSellsFilters],
  (sells, filters) => {
    let filtered = [...sells];
    
    // Filter by customer if specified
    if (filters.customerId) {
      filtered = filtered.filter(sell => sell.customerId === filters.customerId);
    }
    
    // Filter by status if specified (can be comma-separated)
    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      filtered = filtered.filter(sell => statuses.includes(sell.saleStatus));
    }
    
    // Filter by saleStatus if specified (single status)
    if (filters.saleStatus) {
      filtered = filtered.filter(sell => sell.saleStatus === filters.saleStatus);
    }
    
    // Filter by itemSaleStatus if specified
    if (filters.itemSaleStatus) {
      filtered = filtered.filter(sell => 
        sell.items?.some(item => item.itemSaleStatus === filters.itemSaleStatus)
      );
    }
    
    // Filter by date range if specified
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(sell => {
        const sellDate = new Date(sell.saleDate || sell.createdAt);
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        
        let passes = true;
        if (start) {
          passes = passes && sellDate >= start;
        }
        if (end) {
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          passes = passes && sellDate <= endDate;
        }
        return passes;
      });
    }
    
    return filtered;
  }
);

// Selector for filtered count
export const selectFilteredUserSellsCount = createSelector(
  [selectFilteredUserSells],
  (filteredSells) => filteredSells.length
);

// Selector to check if a specific sell is being converted
export const selectIsSellConverting = (sellId: string) => 
  createSelector(
    [selectConvertingOrderIds],
    (convertingIds) => convertingIds.includes(sellId)
  );

// Selector to get conversion error for a specific sell
export const selectSellConversionError = (sellId: string) => 
  createSelector(
    [selectConversionErrors],
    (errors) => errors[sellId]
  );

// Memoized selector for sells that can be converted
export const selectConvertibleSells = createSelector(
  [selectUserSells],
  (sells) => sells.filter(sell => 
    !sell.locked && 
    ['PENDING', 'APPROVED', 'NOT_APPROVED'].includes(sell.saleStatus)
  )
);

// Memoized selector for sells by status
export const selectUserSellsByStatus = (status: SaleStatus) => 
  createSelector(
    [selectUserSells],
    (sells) => sells.filter(sell => sell.saleStatus === status)
  );

// Memoized selector for sells by customer (updated to use string or number)
export const selectUserSellsByCustomer = (customerId: string | number) => 
  createSelector(
    [selectUserSells],
    (sells) => sells.filter(sell => String(sell.customerId) === String(customerId))
  );

// Memoized selector for sells by status string (supports multiple statuses)
export const selectUserSellsByStatusString = (statusString: string) => 
  createSelector(
    [selectUserSells],
    (sells) => {
      if (!statusString) return sells;
      const statuses = statusString.split(',').map(s => s.trim());
      return sells.filter(sell => statuses.includes(sell.saleStatus));
    }
  );

// Memoized selector for specific sell by ID
export const selectUserSellById = (sellId: string) => 
  createSelector(
    [selectUserSells],
    (sells) => sells.find(sell => sell.id === sellId)
  );

// Memoized selector for sells within date range
export const selectUserSellsByDateRange = (startDate: string, endDate: string) => 
  createSelector(
    [selectUserSells],
    (sells) => sells.filter(sell => {
      const sellDate = new Date(sell.saleDate || sell.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return sellDate >= start && sellDate <= end;
    })
  );

// Memoized selector for recent sells (last 7 days)
export const selectRecentUserSells = createSelector(
  [selectUserSells],
  (sells) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return sells.filter(sell => new Date(sell.saleDate || sell.createdAt) >= oneWeekAgo);
  }
);

// Memoized selector for sells with specific item status
export const selectUserSellsWithItemStatus = (itemStatus: ItemSaleStatus) => 
  createSelector(
    [selectUserSells],
    (sells) => sells.filter(sell => 
      sell.items?.some(item => item.itemSaleStatus === itemStatus)
    )
  );

// Memoized selector for sells with batches
export const selectUserSellsWithBatches = createSelector(
  [selectUserSells],
  (sells) => sells.filter(sell => 
    sell.items?.some(item => item.batches && item.batches.length > 0)
  )
);

// Memoized selector for sell items by product
export const selectSellItemsByProduct = (productId: string) => 
  createSelector(
    [selectUserSells],
    (sells) => {
      const allItems: SellItem[] = [];
      sells.forEach(sell => {
        if (sell.items) {
          const productItems = sell.items.filter(item => item.productId === productId);
          allItems.push(...productItems);
        }
      });
      return allItems;
    }
  );

// Memoized selector for sell items by shop
export const selectSellItemsByShop = (shopId: string) => 
  createSelector(
    [selectUserSells],
    (sells) => {
      const allItems: SellItem[] = [];
      sells.forEach(sell => {
        if (sell.items) {
          const shopItems = sell.items.filter(item => item.shopId === shopId);
          allItems.push(...shopItems);
        }
      });
      return allItems;
    }
  );

// Memoized selector for total sales amount
export const selectTotalSalesAmount = createSelector(
  [selectUserSells],
  (sells) => sells.reduce((total, sell) => total + (sell.grandTotal || 0), 0)
);

// Memoized selector for average sale value
export const selectAverageSaleValue = createSelector(
  [selectUserSells, selectUserSellsCount],
  (sells, count) => count > 0 ? sells.reduce((total, sell) => total + (sell.grandTotal || 0), 0) / count : 0
);

// Memoized selector for sells statistics
export const selectUserSellsStatistics = createSelector(
  [selectUserSells],
  (sells) => {
    const stats = {
      totalSells: sells.length,
      totalRevenue: sells.reduce((sum, sell) => sum + (sell.grandTotal || 0), 0),
      totalDiscount: sells.reduce((sum, sell) => sum + (sell.discount || 0), 0),
      totalVat: sells.reduce((sum, sell) => sum + (sell.vat || 0), 0),
      totalProducts: sells.reduce((sum, sell) => sum + (sell.totalProducts || 0), 0),
      totalItems: sells.reduce((sum, sell) => sum + (sell.items?.length || 0), 0),
      convertibleSells: sells.filter(s => !s.locked && ['PENDING', 'APPROVED', 'NOT_APPROVED'].includes(s.saleStatus)).length,
      lockedSells: sells.filter(s => s.locked).length,
      statusCount: {} as Record<SaleStatus, number>,
      customerCount: {} as Record<string, number>,
      branchCount: {} as Record<string, number>,
      itemStatusCount: {} as Record<ItemSaleStatus, number>,
    };

    sells.forEach(sell => {
      // Count by status
      stats.statusCount[sell.saleStatus] = (stats.statusCount[sell.saleStatus] || 0) + 1;
      
      // Count by customer
      if (sell.customerId) {
        const customerKey = String(sell.customerId);
        stats.customerCount[customerKey] = (stats.customerCount[customerKey] || 0) + 1;
      }
      
      // Count by branch
      if (sell.branchId) {
        stats.branchCount[sell.branchId] = (stats.branchCount[sell.branchId] || 0) + 1;
      }
      
      // Count by item status
      if (sell.items) {
        sell.items.forEach(item => {
          stats.itemStatusCount[item.itemSaleStatus] = (stats.itemStatusCount[item.itemSaleStatus] || 0) + 1;
        });
      }
    });

    return stats;
  }
);

// Memoized selector for batch usage statistics
export const selectBatchUsageStatistics = createSelector(
  [selectUserSells],
  (sells) => {
    const batchStats: Record<string, { 
      batchId: string; 
      productId: string; 
      totalQuantity: number; 
      usedInSells: number;
    }> = {};

    sells.forEach(sell => {
      if (sell.items) {
        sell.items.forEach(item => {
          if (item.batches) {
            item.batches.forEach(sellItemBatch => {
              const key = sellItemBatch.batchId;
              if (!batchStats[key]) {
                batchStats[key] = {
                  batchId: sellItemBatch.batchId,
                  productId: item.productId,
                  totalQuantity: 0,
                  usedInSells: 0
                };
              }
              batchStats[key].totalQuantity += sellItemBatch.quantity;
              batchStats[key].usedInSells += 1;
            });
          }
        });
      }
    });

    return Object.values(batchStats);
  }
);

// Selector to check if any filters are active
export const selectHasActiveFilters = createSelector(
  [selectUserSellsFilters],
  (filters) => {
    return Object.keys(filters).some(key => 
      filters[key as keyof typeof filters] !== undefined && 
      filters[key as keyof typeof filters] !== ''
    );
  }
);

// Selector to get active filter count
export const selectActiveFilterCount = createSelector(
  [selectUserSellsFilters],
  (filters) => {
    return Object.keys(filters).filter(key => 
      filters[key as keyof typeof filters] !== undefined && 
      filters[key as keyof typeof filters] !== ''
    ).length;
  }
);

export default userSellsSlice.reducer;