import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { getCategories, getCategoryById, CategoriesResponse, CategoryResponse, Category } from "@/(services)/api/catagory";

// Async thunk for fetching all categories
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCategories();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch categories");
    }
  }
);

// Async thunk for fetching category by ID
export const fetchCategoryById = createAsyncThunk(
  "categories/fetchCategoryById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await getCategoryById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch category");
    }
  }
);

// Define the state interface
interface CategoriesState {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
  count: number;
}

const initialState: CategoriesState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
  count: 0,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearCategories: (state) => {
      state.categories = [];
      state.count = 0;
      state.error = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<CategoriesResponse>) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.count = action.payload.count;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.categories = [];
        state.count = 0;
      })
      // Fetch Category By ID
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action: PayloadAction<CategoryResponse>) => {
        state.loading = false;
        state.currentCategory = action.payload.category;
        state.error = null;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentCategory = null;
      });
  },
});

export const { 
  clearCategories, 
  clearCurrentCategory, 
  clearError 
} = categoriesSlice.actions;

// Select the entire categories state
const selectCategoriesState = (state: { categories: CategoriesState }) => 
  state.categories;

// Memoized selectors using Redux Toolkit's createSelector
export const selectCategories = createSelector(
  [selectCategoriesState],
  (state) => state.categories
);

export const selectCurrentCategory = createSelector(
  [selectCategoriesState],
  (state) => state.currentCategory
);

export const selectCategoriesLoading = createSelector(
  [selectCategoriesState],
  (state) => state.loading
);

export const selectCategoriesError = createSelector(
  [selectCategoriesState],
  (state) => state.error
);

export const selectCategoriesCount = createSelector(
  [selectCategoriesState],
  (state) => state.count
);

// Memoized selector for categories with subcategories
export const selectCategoriesWithSubcategories = createSelector(
  [selectCategories],
  (categories) => categories.filter(category => 
    category.subCategories && category.subCategories.length > 0
  )
);

// Memoized selector for categories with products
export const selectCategoriesWithProducts = createSelector(
  [selectCategories],
  (categories) => categories.filter(category => 
    category._count?.products && category._count.products > 0
  )
);

// Memoized selector for specific category by ID
export const selectCategoryById = (categoryId: string) => 
  createSelector(
    [selectCategories],
    (categories) => categories.find(category => category.id === categoryId)
  );

export default categoriesSlice.reducer;