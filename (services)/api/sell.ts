import api from "@/(utils)/config";
import { GetAllSellsUserParams, GetAllSellsUserResponse } from "@/(utils)/types";


// Get all sells for a specific user
export const getAllSellsUser = async (
  params: GetAllSellsUserParams
): Promise<GetAllSellsUserResponse> => {
  try {
    const response = await api.get("/sells/user/based", {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        customerId: params.customerId,
        status: params.status,
      }
    });
    
    return {
      success: true,
      sells: response.data.sells || [],
      count: response.data.count || 0,
      meta: response.data.meta || {},
    };
  } catch (error: any) {
    console.error("Error fetching user sells:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch user sells");
  }
};


export const convertOrderToCart = async (
  sellId: string
): Promise<{
  success: boolean;
  message: string;
  cart: any;
  originalOrder: {
    invoiceNo: string;
    saleStatus: string;
    grandTotal: number;
    totalProducts: number;
  };
}> => {
  try {
    const response = await api.post(`/carts/convert/${sellId}/OrderToCart`);
    
    return {
      success: true,
      message: response.data.message,
      cart: response.data.cart,
      originalOrder: response.data.originalOrder,
    };
  } catch (error: any) {
    console.error("Error converting order to cart:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to convert order to cart");
  }
};