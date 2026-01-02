import api from "@/(utils)/config";

// Types for Top Selling Products based on backend response
export interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol?: string;
  base?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shop {
  id: string;
  name: string;
  branchId: string;
  branch: Branch;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdditionalPrice {
  id: string;
  label: string;
  price: number;
  shopId: string;
  shop: Shop | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopLocation {
  shopId: string;
  shopName: string;
  branchId: string;
  branchName: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
}

export interface ProductBatch {
  batchId: string;
  batchNumber: string;
  expiryDate: string | null;
  availableQuantity: number;
  shopLocations: ShopLocation[];
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  generic?: string | null;
  description?: string | null;
  sellPrice: number | null;
  imageUrl: string;
  category: Category;
  subCategory?: SubCategory | null;
  unitOfMeasure: UnitOfMeasure;
  isActive: boolean;
  additionalPrices: AdditionalPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface TopSellingProduct {
  product: Product;
  // Note: The backend response structure shows product directly without these nested fields
  // availableQuantity: number;
  // shopLocations: ShopLocation[];
  // batches: ProductBatch[];
}

export interface TopSellingProductsResponse {
  success?: boolean;
  products: TopSellingProduct[];
  count: number;
  note?: string; // For fallback case when no top-selling products found
}

// Parameters for getting top selling products
export interface GetTopSellingProductsParams {
  searchTerm?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
}

// Get Top Selling Products with optional search and filters
export const getTopSellingProducts = async (
  params?: GetTopSellingProductsParams
): Promise<TopSellingProductsResponse> => {
  try {
    
    // Build query parameters
    const queryParams: Record<string, string> = {};
    
    if (params?.searchTerm && params.searchTerm.trim() !== '') {
      queryParams.searchTerm = params.searchTerm.trim();
    }
    
    if (params?.categoryId && params.categoryId.trim() !== '') {
      queryParams.categoryId = params.categoryId.trim();
    }
    
    if (params?.subCategoryId && params.subCategoryId.trim() !== '') {
      queryParams.subCategoryId = params.subCategoryId.trim();
    }

    const response = await api.get("/products/get/all/Top/Selling/Products", {
      params: queryParams
    });
    // Ensure the response has the expected structure
    return {
      success: true,
      products: response.data.products || [],
      count: response.data.count || 0,
      note: response.data.note || ''
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch top selling products");
  }
};

// Get Top Selling Products with all parameters explicitly
export const getTopSellingProductsWithFilters = async (
  searchTerm?: string | null,
  categoryId?: string | null,
  subCategoryId?: string | null
): Promise<TopSellingProductsResponse> => {
  return getTopSellingProducts({
    searchTerm,
    categoryId,
    subCategoryId
  });
};

// Optional: Get random products with shop stocks (fallback)
export const getRandomProductsWithShopStocks = async (): Promise<TopSellingProductsResponse> => {
  try {
    const response = await api.get("/products/random/with/shop/stocks");
    
    return {
      success: true,
      products: response.data.products || [],
      count: response.data.count || 0,
      note: response.data.note || 'Random products with available shop stock'
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch random products");
  }
};

// Utility function to check if a string is a valid UUID (for debugging)
export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};