import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { 
  getCustomersWithFallback, 
  createCustomer, 
  CustomersResponse, 
  CreateCustomerResponse, 
  Customer, 
  CreateCustomerData 
} from "@/(services)/api/customer";

// Async thunk for fetching customers with search support
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (
    args: string | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await getCustomersWithFallback(args);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch customers");
    }
  }
);

// Async thunk for creating a customer
export const createCustomerAction = createAsyncThunk(
  "customers/createCustomer",
  async (customerData: CreateCustomerData, { rejectWithValue }) => {
    try {
      const response = await createCustomer(customerData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create customer");
    }
  }
);

// Define the state interface
interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  count: number;
  createLoading: boolean;
  createError: string | null;
  currentCustomer: Customer | null;
  selectedCustomerId: string | null;
  // New metadata fields
  isSearchResults: boolean;
  isTopCustomers: boolean;
  isDefaultCustomers: boolean;
}

const initialState: CustomersState = {
  customers: [],
  loading: false,
  error: null,
  count: 0,
  createLoading: false,
  createError: null,
  currentCustomer: null,
  selectedCustomerId: null,
  // Initialize metadata
  isSearchResults: false,
  isTopCustomers: false,
  isDefaultCustomers: false,
};

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearCustomers: (state) => {
      state.customers = [];
      state.count = 0;
      state.error = null;
      // Reset metadata when clearing
      state.isSearchResults = false;
      state.isTopCustomers = false;
      state.isDefaultCustomers = false;
    },
    clearError: (state) => {
      state.error = null;
      state.createError = null;
    },
    // Add customer manually (for optimistic updates)
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.push(action.payload);
      state.count += 1;
    },
    setCurrentCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.currentCustomer = action.payload;
    },
    setSelectedCustomerId: (state, action: PayloadAction<string | null>) => {
      state.selectedCustomerId = action.payload;
    },
    // Reset metadata flags
    resetCustomerMetadata: (state) => {
      state.isSearchResults = false;
      state.isTopCustomers = false;
      state.isDefaultCustomers = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers (with optional search)
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action: PayloadAction<CustomersResponse>) => {
        state.loading = false;
        state.customers = action.payload.customers;
        state.count = action.payload.count;
        state.error = null;
        // Set metadata from response
        state.isSearchResults = action.payload.isSearchResults || false;
        state.isTopCustomers = action.payload.isTopCustomers || false;
        state.isDefaultCustomers = action.payload.isDefaultCustomers || false;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.customers = [];
        state.count = 0;
        // Reset metadata on error
        state.isSearchResults = false;
        state.isTopCustomers = false;
        state.isDefaultCustomers = false;
      })
      // Create Customer
      .addCase(createCustomerAction.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createCustomerAction.fulfilled, (state, action: PayloadAction<CreateCustomerResponse>) => {
        state.createLoading = false;
        // Add the new customer to the list
        state.customers.push(action.payload.customer);
        state.count += 1;
        state.createError = null;
      })
      .addCase(createCustomerAction.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload as string;
      });
  },
});

export const { 
  clearCustomers, 
  clearError,
  addCustomer,
  setCurrentCustomer,
  setSelectedCustomerId,
  resetCustomerMetadata,
} = customersSlice.actions;

// Select the entire customers state
const selectCustomersState = (state: { customers: CustomersState }) => 
  state.customers;

// Memoized selectors using Redux Toolkit's createSelector

// Basic state selectors
export const selectCustomers = createSelector(
  [selectCustomersState],
  (state) => state.customers
);

export const selectCustomersLoading = createSelector(
  [selectCustomersState],
  (state) => state.loading
);

export const selectCustomersError = createSelector(
  [selectCustomersState],
  (state) => state.error
);

export const selectCustomersCount = createSelector(
  [selectCustomersState],
  (state) => state.count
);

export const selectCreateCustomerLoading = createSelector(
  [selectCustomersState],
  (state) => state.createLoading
);

export const selectCreateCustomerError = createSelector(
  [selectCustomersState],
  (state) => state.createError
);

// Metadata selectors
export const selectIsSearchResults = createSelector(
  [selectCustomersState],
  (state) => state.isSearchResults
);

export const selectIsTopCustomers = createSelector(
  [selectCustomersState],
  (state) => state.isTopCustomers
);

export const selectIsDefaultCustomers = createSelector(
  [selectCustomersState],
  (state) => state.isDefaultCustomers
);

// Customer object selectors
export const selectCurrentCustomer = createSelector(
  [selectCustomersState],
  (state) => state.currentCustomer
);

export const selectSelectedCustomerId = createSelector(
  [selectCustomersState],
  (state) => state.selectedCustomerId
);

// Memoized selector for specific customer by ID
export const selectCustomerById = (customerId: string) => 
  createSelector(
    [selectCustomers],
    (customers) => customers.find(customer => customer.id === customerId)
  );

// Memoized selector for customers with company names
export const selectCustomersWithCompany = createSelector(
  [selectCustomers],
  (customers) => customers.filter(customer => 
    customer.companyName && customer.companyName.trim() !== ''
  )
);

// Memoized selector for customers with tin numbers
export const selectCustomersWithTin = createSelector(
  [selectCustomers],
  (customers) => customers.filter(customer => 
    customer.tinNumber && customer.tinNumber.trim() !== ''
  )
);

// Memoized selector for customers by phone number
export const selectCustomerByPhone = (phone: string) => 
  createSelector(
    [selectCustomers],
    (customers) => customers.find(customer => 
      customer.phone1 === phone || customer.phone2 === phone
    )
  );

// Combined selector for all metadata
export const selectCustomerMetadata = createSelector(
  [selectIsSearchResults, selectIsTopCustomers, selectIsDefaultCustomers],
  (isSearchResults, isTopCustomers, isDefaultCustomers) => ({
    isSearchResults,
    isTopCustomers,
    isDefaultCustomers,
  })
);

// Selector for top customers (if metadata indicates)
export const selectTopCustomers = createSelector(
  [selectCustomers, selectIsTopCustomers],
  (customers, isTopCustomers) => isTopCustomers ? customers : []
);

// Selector for search results (if metadata indicates)
export const selectSearchResults = createSelector(
  [selectCustomers, selectIsSearchResults],
  (customers, isSearchResults) => isSearchResults ? customers : []
);

// Selector for default customers (if metadata indicates)
export const selectDefaultCustomers = createSelector(
  [selectCustomers, selectIsDefaultCustomers],
  (customers, isDefaultCustomers) => isDefaultCustomers ? customers : []
);

export default customersSlice.reducer;