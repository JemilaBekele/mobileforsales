import { create } from 'zustand';
import { TopSellingProduct, GetTopSellingProductsParams, getTopSellingProducts } from '@/(services)/api/topSellingProducts';

interface TopSellingState {
  products: TopSellingProduct[];
  loading: boolean;
  error: string | null;
  count: number;
  note: string;
  
  // Actions
  fetchTopSellingProducts: (params?: GetTopSellingProductsParams) => Promise<void>;
  clearError: () => void;
  setProducts: (products: TopSellingProduct[]) => void;
}

export const useTopSellingStore = create<TopSellingState>((set) => ({
  products: [],
  loading: false,
  error: null,
  count: 0,
  note: '',
  
  fetchTopSellingProducts: async (params?: GetTopSellingProductsParams) => {
    set({ loading: true, error: null });
    
    try {
      const response = await getTopSellingProducts(params);
      set({
        products: response.products || [],
        loading: false,
        count: response.count || 0,
        note: response.note || '',
        error: null
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || "Failed to fetch top selling products",
        products: [],
        count: 0,
        note: ''
      });
    }
  },
  
  clearError: () => set({ error: null }),
  
  setProducts: (products) => set({ products }),
}));

// Selectors (optional but recommended for performance)
export const selectTopSellingProducts = (state: TopSellingState) => state.products;
export const selectTopSellingProductsLoading = (state: TopSellingState) => state.loading;
export const selectTopSellingProductsError = (state: TopSellingState) => state.error;
export const selectTopSellingCount = (state: TopSellingState) => state.count;
export const selectTopSellingNote = (state: TopSellingState) => state.note;