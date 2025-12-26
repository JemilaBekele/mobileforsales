import api from "@/(utils)/config";

// Types for Cart
export interface CartItem {
  id: string;
  cartId: string;
  shopId: string;
  productId: string;
  unitOfMeasureId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Relations
  shop?: Shop;
  product?: Product;
  batch?: ProductBatch;
  unitOfMeasure?: UnitOfMeasure;
}

export interface Cart {
  customerId: any;
  id: string;
  userId: string;
  branchId?: string;
  totalItems: number;
  totalAmount: number;
  isCheckedOut: boolean;
  createdById?: string;
  updatedById?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Relations
  user?: User;
  branch?: Branch;
  createdBy?: User;
  updatedBy?: User;
  items: CartItem[];
  
  // Metadata for filtered carts
  _metadata?: {
    totalItems: number;
    accessibleItems: number;
    hasRestrictedAccess: boolean;
  };
}

export interface User {
  id: string;
  // Add other user fields as needed
  shops?: Shop[];
}

export interface Shop {
  id: string;
  name?: string;
  // Add other shop fields as needed
}

export interface Branch {
  id: string;
  // Add other branch fields as needed
}

export interface Product {
  id: string;
  name: string;
  sellPrice?: number;
  unitOfMeasureId?: string;
  // Add other product fields as needed
  unitOfMeasure?: UnitOfMeasure;
  category?: Category;
}

export interface ProductBatch {
  id: string;
  productId: string;
  product?: Product;
  AdditionalPrice?: AdditionalPrice[];
}

export interface UnitOfMeasure {
  id: string;
  name?: string;
  // Add unit of measure fields
}

export interface AdditionalPrice {
  id: string;
  // Add additional price fields
}

export interface Category {
  id: string;
  name?: string;
  // Add category fields
}

// Request/Response Types
export interface CartItemRequest {
  productId: string;
  shopId: string;
  quantity: number;
  unitPrice?: number;
  unitOfMeasureId?: string;
  notes?: string;
}

export interface UpdateCartItemRequest {
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface CheckoutCartRequest {
  customerId?: string;
  paymentMethod?: string;
  // Add other checkout fields as needed
}

export interface CartResponse {
  success: boolean;
  cart: Cart;
}

export interface CartItemResponse {
  success: boolean;
  cartItem: CartItem;
  message: string;
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  cart: Cart;
  sell: any; // You can define Sell type based on your sell service
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

// Cart API Functions - BUYER ONLY

// Get current user's cart
export const getMyCart = async (): Promise<CartResponse> => {
  try {
    const response = await api.get("/carts/my-cart");
    
    return {
      success: true,
      cart: response.data.cart || response.data,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch user cart");
  }
};

// Get cart by ID with user filtering (for shared carts or specific access)
export const getCartByIdWithUserFilter = async (id: string): Promise<CartResponse> => {
  try {
    const response = await api.get(`/carts/${id}/user-filtered`);
    
    return {
      success: true,
      cart: response.data.cart || response.data,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch filtered cart");
  }
};

// Add item to cart
export const addItemToCart = async (cartId: string, itemData: CartItemRequest): Promise<CartItemResponse> => {
  try {
    const response = await api.post(`/carts/${cartId}/items`, itemData);
    
    return {
      success: true,
      cartItem: response.data.cartItem || response.data,
      message: response.data.message || "Item added to cart successfully",
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to add item to cart");
  }
};

// Update cart item (quantity, price, notes)
export const updateCartItem = async (cartItemId: string, updateData: UpdateCartItemRequest): Promise<CartItemResponse> => {
  try {
    const response = await api.put(`/carts/items/${cartItemId}`, updateData);
    
    return {
      success: true,
      cartItem: response.data.cartItem || response.data,
      message: response.data.message || "Cart item updated successfully",
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update cart item");
  }
};

// Remove item from cart
export const removeItemFromCart = async (cartItemId: string): Promise<MessageResponse> => {
  try {
    const response = await api.delete(`/carts/items/${cartItemId}`);
    
    return {
      success: true,
      message: response.data.message || "Item removed from cart successfully",
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to remove item from cart");
  }
};

// Checkout cart (convert to order)
export const checkoutCart = async (cartId: string, checkoutData: CheckoutCartRequest): Promise<CheckoutResponse> => {
  try {
    const response = await api.post(`/carts/${cartId}/checkout`, checkoutData);
    
    return {
      success: true,
      message: response.data.message || "Cart checked out successfully",
      cart: response.data.cart,
      sell: response.data.sell,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to checkout cart");
  }
};

// Clear cart (remove all items)
export const clearCart = async (cartId: string): Promise<MessageResponse> => {
  try {
    const response = await api.delete(`/carts/${cartId}/clear`);
    
    return {
      success: true,
      message: response.data.message || "Cart cleared successfully",
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to clear cart");
  }
};

// Helper function to get or create user cart
export const getOrCreateUserCart = async (): Promise<CartResponse> => {
  try {
    // First try to get existing cart
    const myCartResponse = await getMyCart();
    
    if (myCartResponse.cart) {
      return myCartResponse;
    }
    
    // If no cart exists, create an empty one by adding an item or through first add operation
    // For buyers, we typically create cart when first item is added
    throw new Error("No active cart found. Add an item to create a cart.");
  } catch (error: any) {
    throw error;
  }
};

// Helper to add item to user's current cart (most common buyer operation)
export const addItemToMyCart = async (itemData: CartItemRequest): Promise<CartItemResponse> => {
  try {
    // Get user's current cart
    const cartResponse = await getMyCart();
    
    if (!cartResponse.cart) {
      throw new Error("No active cart found");
    }
    
    // Add item to the cart
    return await addItemToCart(cartResponse.cart.id, itemData);
  } catch (error: any) {
    throw error;
  }
};

// Helper to update quantity of item in user's cart
export const updateItemQuantity = async (cartItemId: string, quantity: number): Promise<CartItemResponse> => {
  return await updateCartItem(cartItemId, { quantity });
};