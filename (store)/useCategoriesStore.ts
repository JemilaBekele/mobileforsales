import { create } from 'zustand';
import { Category, getCategories } from '@/(services)/api/catagory';

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  count: number;
  
  // Actions
  fetchCategories: () => Promise<void>;
  clearError: () => void;
  setCategories: (categories: Category[]) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  loading: false,
  error: null,
  count: 0,
  
  fetchCategories: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await getCategories();
      set({
        categories: response.categories || [],
        loading: false,
        count: response.count || 0,
        error: null
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to fetch categories",
        categories: [],
        count: 0
      });
    }
  },
  
  clearError: () => set({ error: null }),
  
  setCategories: (categories) => set({ categories }),
}));

// Selectors
export const selectCategories = (state: CategoriesState) => state.categories;
export const selectCategoriesLoading = (state: CategoriesState) => state.loading;
export const selectCategoriesError = (state: CategoriesState) => state.error;