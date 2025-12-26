
// Shop API Functions

import api from "@/(utils)/config";


/**
 * Get shops based on the authenticated user
 */
export const getShopsBasedOnUser = async (): Promise<IShop[]> => {
  try {
    const response = await api.get("/shops/based/user");
    
    return response.data.shops || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch user shops");
  }
};

/**
 * Get available batches by product and shop
 */
export const getAvailableBatchesByProductAndShop = async (
  shopId: string, 
  productId: string
): Promise<IBatchesResponse> => {
  try {
    
    const response = await api.get(
      `/shops/${productId}/products/${shopId}/batches`
    );
    
    
    return {
      batches: response.data.batches || [],
      count: response.data.count || 0,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch batches");
  }
};

// Types (add these to your types file or define here)
export interface IShop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface IBatch {
  id: string;
  batchNumber: string;
  productId: string;
  expiryDate: string;
  manufactureDate?: string;
  costPrice?: number;
  sellingPrice?: number;
  quantity?: number;
  status?: string;
  product?: {
    id: string;
    name: string;
    code?: string;
    unitOfMeasure?: {
      id: string;
      name: string;
      abbreviation: string;
    };
    category?: {
      id: string;
      name: string;
    };
    subCategory?: {
      id: string;
      name: string;
    };
  };
  store?: {
    id: string;
    name: string;
  };
  AdditionalPrice?: {
    id: string;
    lable: string;
    price: number;
    shopId?: string;
  }[];
  ShopStock?: {
    id: string;
    quantity: number;
    status: string;
    unitOfMeasure?: {
      id: string;
      name: string;
      abbreviation: string;
    };
  }[];
}

export interface IBatchesResponse {
  batches: IBatch[];
  count: number;
}
