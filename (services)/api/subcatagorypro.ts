import api from "@/(utils)/config";

// Types for Subcategory Products based on backend response
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

export interface Product {
  id: string;
  productCode: string;
  name: string;
  generic?: string | null;
  description?: string | null;
  category: Category;
  subCategory?: SubCategory | null;
  unitOfMeasure: UnitOfMeasure;
  sellPrice: number | null;
  imageUrl: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsBySubCategoryResponse {
  success: boolean;
  message: string;
  products: Product[];
  count: number;
}

export interface SubCategoryList {
  id: string;
  name: string;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategoriesResponse {
  success: boolean;
  message: string;
  subCategories: SubCategoryList[];
  count: number;
}

// Get products by subcategory ID
export const getProductsBySubCategoryId = async (
  subCategoryId: string
): Promise<ProductsBySubCategoryResponse> => {
  try {
    const response = await api.get(`/products/subcategory/all/${subCategoryId}`);
    
    return {
      success: response.data.success || true,
      message: response.data.message || 'Products fetched successfully',
      products: response.data.products || [],
      count: response.data.count || 0
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch products by subcategory ID");
  }
};

// Get all subcategories for a category
export const getSubCategoriesByCategory = async (
  categoryId: string
): Promise<SubCategoriesResponse> => {
  try {
    const response = await api.get(`/products/category/${categoryId}/subcategory`);
    
    return {
      success: response.data.success || true,
      message: response.data.message || 'Subcategories fetched successfully',
      subCategories: response.data.subCategories || [],
      count: response.data.count || 0
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch subcategories");
  }
};