import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { 
  getProductsBySubCategoryId, 
  ProductsBySubCategoryResponse, 
  Product,
  getSubCategoriesByCategory,
  SubCategoryList,
} from "@/(services)/api/subcatagorypro";

// Async thunk for fetching products by subcategory ID
export const fetchProductsBySubCategoryId = createAsyncThunk(
  "subcategoryProducts/fetchProductsBySubCategoryId",
  async (subCategoryId: string, { rejectWithValue }) => {
    try {
      const response = await getProductsBySubCategoryId(subCategoryId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch subcategory products");
    }
  }
);

// Async thunk for fetching subcategories by category ID
export const fetchSubCategoriesByCategory = createAsyncThunk(
  "subcategoryProducts/fetchSubCategoriesByCategory",
  async (categoryId: string, { rejectWithValue }) => {
    try {
      const response = await getSubCategoriesByCategory(categoryId);
      return {
        subCategories: response.subCategories,
        count: response.count,
        categoryId
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch subcategories");
    }
  }
);

// Define the state interface
interface SubcategoryProductsState {
  products: Product[];
  subCategories: SubCategoryList[];
  loading: boolean;
  subCategoriesLoading: boolean;
  error: string | null;
  subCategoriesError: string | null;
  count: number;
  currentCategoryId: string | null;
}

const initialState: SubcategoryProductsState = {
  products: [],
  subCategories: [],
  loading: false,
  subCategoriesLoading: false,
  error: null,
  subCategoriesError: null,
  count: 0,
  currentCategoryId: null,
};

const subcategoryProductsSlice = createSlice({
  name: "subcategoryProducts",
  initialState,
  reducers: {
    clearSubcategoryProducts: (state) => {
      state.products = [];
      state.count = 0;
      state.error = null;
    },
    clearSubCategories: (state) => {
      state.subCategories = [];
      state.subCategoriesError = null;
      state.currentCategoryId = null;
    },
    clearAll: (state) => {
      state.products = [];
      state.subCategories = [];
      state.loading = false;
      state.subCategoriesLoading = false;
      state.error = null;
      state.subCategoriesError = null;
      state.count = 0;
      state.currentCategoryId = null;
    },
    clearError: (state) => {
      state.error = null;
      state.subCategoriesError = null;
    },
    setCurrentCategory: (state, action: PayloadAction<string>) => {
      state.currentCategoryId = action.payload;
    },
    // Reducer to update product price
    updateProductPrice: (state, action: PayloadAction<{ 
      productId: string; 
      sellPrice: number | null;
    }>) => {
      const product = state.products.find(p => p.id === action.payload.productId);
      if (product) {
        product.sellPrice = action.payload.sellPrice;
      }
    },
    // Reducer to toggle product active status
    toggleProductActiveStatus: (state, action: PayloadAction<string>) => {
      const product = state.products.find(p => p.id === action.payload);
      if (product) {
        product.isActive = !product.isActive;
      }
    },
    // Reducer to filter products by active status
    filterProductsByActiveStatus: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        // Store original products before filtering if needed, or handle differently
        // This is a simplified approach - you might want to store original products separately
        state.products = state.products.filter(product => product.isActive);
        state.count = state.products.length;
      }
      // Note: To reset filtering, you'd need to refetch or store original data separately
    },
    // Reducer to search products by name
    searchProductsByName: (state, action: PayloadAction<string>) => {
      const searchTerm = action.payload.toLowerCase();
      if (searchTerm) {
        // Store original products before filtering if needed
        state.products = state.products.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.generic?.toLowerCase().includes(searchTerm) ||
          product.productCode.toLowerCase().includes(searchTerm)
        );
        state.count = state.products.length;
      }
      // Note: To reset search, you'd need to refetch or store original data separately
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products by Subcategory ID
      .addCase(fetchProductsBySubCategoryId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsBySubCategoryId.fulfilled, (state, action: PayloadAction<ProductsBySubCategoryResponse>) => {
        state.loading = false;
        state.products = action.payload.products;
        state.count = action.payload.count;
        state.error = null;
      })
      .addCase(fetchProductsBySubCategoryId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.products = [];
        state.count = 0;
      })
      // Fetch Subcategories by Category ID
      .addCase(fetchSubCategoriesByCategory.pending, (state) => {
        state.subCategoriesLoading = true;
        state.subCategoriesError = null;
      })
      .addCase(fetchSubCategoriesByCategory.fulfilled, (state, action: PayloadAction<{ 
        subCategories: SubCategoryList[]; 
        count: number;
        categoryId: string;
      }>) => {
        state.subCategoriesLoading = false;
        state.subCategories = action.payload.subCategories;
        state.currentCategoryId = action.payload.categoryId;
        state.subCategoriesError = null;
      })
      .addCase(fetchSubCategoriesByCategory.rejected, (state, action) => {
        state.subCategoriesLoading = false;
        state.subCategoriesError = action.payload as string;
        state.subCategories = [];
        state.currentCategoryId = null;
      });
  },
});

export const { 
  clearSubcategoryProducts, 
  clearSubCategories,
  clearAll,
  clearError, 
  setCurrentCategory,
  updateProductPrice,
  toggleProductActiveStatus,
  filterProductsByActiveStatus,
  searchProductsByName
} = subcategoryProductsSlice.actions;

// Select the entire subcategoryProducts state
const selectSubcategoryProductsState = (state: { subcategoryProducts: SubcategoryProductsState }) => 
  state.subcategoryProducts;

// Memoized selectors using Redux Toolkit's createSelector

// Product selectors
export const selectSubcategoryProducts = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.products
);

export const selectSubcategoryProductsLoading = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.loading
);

export const selectSubcategoryProductsError = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.error
);

export const selectSubcategoryProductsCount = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.count
);

// Subcategory selectors
export const selectSubCategories = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.subCategories
);

export const selectSubCategoriesLoading = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.subCategoriesLoading
);

export const selectSubCategoriesError = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.subCategoriesError
);

export const selectCurrentCategoryId = createSelector(
  [selectSubcategoryProductsState],
  (state) => state.currentCategoryId
);

// Combined selectors
export const selectSubcategoryByName = (subCategoryName: string) => 
  createSelector(
    [selectSubCategories],
    (subCategories) => subCategories.find(subCat => subCat.name === subCategoryName)
  );

export const selectSubcategoryById = (subCategoryId: string) => 
  createSelector(
    [selectSubCategories],
    (subCategories) => subCategories.find(subCat => subCat.id === subCategoryId)
  );

export const selectSubCategoriesByCurrentCategory = createSelector(
  [selectSubCategories, selectCurrentCategoryId],
  (subCategories, categoryId) => {
    if (!categoryId) return subCategories;
    return subCategories.filter(subCat => subCat.categoryId === categoryId);
  }
);

// Memoized selector for active products
export const selectActiveSubcategoryProducts = createSelector(
  [selectSubcategoryProducts],
  (products) => products.filter(product => product.isActive)
);

// Memoized selector for products by category
export const selectSubcategoryProductsByCategory = (categoryId: string) => 
  createSelector(
    [selectSubcategoryProducts],
    (products) => products.filter(product => product.category.id === categoryId)
  );

// Memoized selector for specific product by ID
export const selectSubcategoryProductById = (productId: string) => 
  createSelector(
    [selectSubcategoryProducts],
    (products) => products.find(product => product.id === productId)
  );

// Memoized selector for products with price range
export const selectProductsByPriceRange = (minPrice: number, maxPrice: number) => 
  createSelector(
    [selectSubcategoryProducts],
    (products) => products.filter(product => {
      if (!product.sellPrice) return false;
      return product.sellPrice >= minPrice && product.sellPrice <= maxPrice;
    })
  );

// Memoized selector for products by unit of measure
export const selectProductsByUnitOfMeasure = (unitOfMeasureId: string) => 
  createSelector(
    [selectSubcategoryProducts],
    (products) => products.filter(product => product.unitOfMeasure.id === unitOfMeasureId)
  );

// Memoized selector to check if a category has subcategories
export const selectHasSubcategories = (categoryId: string) => 
  createSelector(
    [selectSubCategories],
    (subCategories) => subCategories.some(subCat => subCat.categoryId === categoryId)
  );

// Memoized selector for products sorted by price
export const selectProductsSortedByPrice = (order: 'asc' | 'desc' = 'asc') => 
  createSelector(
    [selectSubcategoryProducts],
    (products) => {
      return [...products].sort((a, b) => {
        const priceA = a.sellPrice || 0;
        const priceB = b.sellPrice || 0;
        return order === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }
  );

// Memoized selector for products sorted by name
export const selectProductsSortedByName = (order: 'asc' | 'desc' = 'asc') => 
  createSelector(
    [selectSubcategoryProducts],
    (products) => {
      return [...products].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (order === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }
  );

export default subcategoryProductsSlice.reducer;