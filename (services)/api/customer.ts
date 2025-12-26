
import api from "@/(utils)/config";

// Types for Customers based on your Prisma model
export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  phone1: string;
  phone2?: string;
  tinNumber?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  // Optional response metadata fields
  isSearchResults?: boolean;
  isTopCustomers?: boolean;
  isDefaultCustomers?: boolean;
}

export interface CreateCustomerData {
  name: string;
  companyName?: string;
  phone1: string;
  phone2?: string;
  tinNumber?: string;
  address?: string;
}

export interface CustomersResponse {
  success: boolean;
  customers: Customer[];
  count: number;
  // Optional metadata from backend
  isSearchResults?: boolean;
  isTopCustomers?: boolean;
  isDefaultCustomers?: boolean;
}

export interface CustomerResponse {
  success: boolean;
  customer: Customer;
}

export interface CreateCustomerResponse {
  success: boolean;
  customer: Customer;
  message?: string;
}

// Customer API Functions

// Get customers with fallback (searchable)
export const getCustomersWithFallback = async (search?: string): Promise<CustomersResponse> => {
  try {
    const params = search?.trim() ? { search: search.trim() } : {};
    const response = await api.get(  '/With/fall/back/customers'
, { params });
    return {
      success: true,
      customers: response.data.customers || [],
      count: response.data.count || 0,
      isSearchResults: response.data.isSearchResults || false,
      isTopCustomers: response.data.isTopCustomers || false,
      isDefaultCustomers: response.data.isDefaultCustomers || false,
    };
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch customers");
  }
};

// Create a new customer
export const createCustomer = async (customerData: CreateCustomerData): Promise<CreateCustomerResponse> => {
  try {
    const response = await api.post("/customers", customerData);
    
    return {
      success: true,
      customer: response.data.customer || response.data,
      message: response.data.message || "Customer created successfully",
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create customer");
  }
};