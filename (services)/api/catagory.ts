import api from "@/(utils)/config";
import { Product } from "./topSellingProducts";

// Base Axios instance (reuse the same instance)


// Types for Categories
export interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  subCategories?: SubCategory[]; // Include subcategories in the response
  products?: Product[]; // Include products count or basic info
  _count?: {
    products?: number;
    subCategories?: number;
  };
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
  products?: Product[];
  _count?: {
    products?: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
  count: number;
}

export interface CategoryResponse {
  success: boolean;
  category: Category;
}

// Category API Functions

// Get all categories
export const getCategories = async (): Promise<CategoriesResponse> => {
  try {
    const response = await api.get("/categories");
    
    return {
      success: true,
      categories: response.data.categories || response.data || [],
      count: response.data.count || response.data.length || 0,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch categories");
  }
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<CategoryResponse> => {
  try {
    const response = await api.get(`/categories/${id}`);
    
    return {
      success: true,
      category: response.data.category || response.data,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch category");
  }
};