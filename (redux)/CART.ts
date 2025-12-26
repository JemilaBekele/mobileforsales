import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { 
  getMyCart, 
  getCartByIdWithUserFilter,
  removeItemFromCart,
  checkoutCart,
  clearCart,
  addItemToMyCart,
  updateItemQuantity,
  CartResponse,
  CartItemResponse,
  CheckoutResponse,
  MessageResponse,
  Cart,
} from "@/(services)/api/CART";
import api  from "@/(utils)/config";

// Async thunks
export const fetchMyCart = createAsyncThunk(
  "cart/fetchMyCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyCart();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch cart");
    }
  }
);

export const fetchCartByIdWithFilter = createAsyncThunk(
  "cart/fetchCartByIdWithFilter",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await getCartByIdWithUserFilter(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch cart");
    }
  }
);

export const addItemToUserCart = createAsyncThunk(
  "cart/addItemToUserCart",
  async (itemData: Parameters<typeof addItemToMyCart>[0], { rejectWithValue }) => {
    try {
      const response = await addItemToMyCart(itemData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add item to cart");
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await updateItemQuantity(cartItemId, quantity);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update cart item");
    }
  }
);

// New: Update cart item price
export const updateCartItemPrice = createAsyncThunk(
  "cart/updateCartItemPrice",
  async ({ cartItemId, unitPrice }: { cartItemId: string; unitPrice: number }, { rejectWithValue }) => {
    try {
      // First, get the current cart item to know its quantity
      const cartResponse = await getMyCart();
      if (!cartResponse.cart) {
        throw new Error("No active cart found");
      }
      
      const cartItem = cartResponse.cart.items.find(item => item.id === cartItemId);
      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      // Remove the item and re-add it with the new price
      await removeItemFromCart(cartItemId);
      
      const addItemPayload = {
        productId: cartItem.productId,
        shopId: cartItem.shopId,
        quantity: cartItem.quantity,
        unitPrice: unitPrice,
        notes: cartItem.notes,
      };

      const response = await addItemToMyCart(addItemPayload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update cart item price");
    }
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (cartItemId: string, { rejectWithValue }) => {
    try {
      const response = await removeItemFromCart(cartItemId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove item from cart");
    }
  }
);

// In your cart slice, replace the checkoutUserCart thunk:

// In your cart slice or action file
export const checkoutUserCart = createAsyncThunk(
  "cart/checkoutUserCart",
  async (checkoutData: {
    customerId: string;
    paymentMethod: string;
    discount?: number;
    notes?: string;
  }, { rejectWithValue }) => {
    try {
      // First get current cart
      const cartResponse = await getMyCart();
      if (!cartResponse.cart) {
        throw new Error("No active cart found");
      }
      
      const cartId = cartResponse.cart.id;
      
      // 1. Assign customer, discount, and notes to cart before checkout
      if (checkoutData.customerId || checkoutData.discount !== undefined || checkoutData.notes !== undefined) {
        try {
          await api.put(`/carts/assign/customer/${cartId}`, { 
            customerId: checkoutData.customerId,
            discount: checkoutData.discount,
            notes: checkoutData.notes
          });
          
          // Wait a moment for the update to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (assignError: any) {
          throw new Error(`Failed to update cart: ${assignError.message}`);
        }
      }
      
      // 2. NOW proceed with checkout
      const response = await checkoutCart(cartId, {
        customerId: checkoutData.customerId,
        paymentMethod: checkoutData.paymentMethod
      });
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to checkout cart");
    }
  }
);

export const clearUserCart = createAsyncThunk(
  "cart/clearUserCart",
  async (_, { rejectWithValue }) => {
    try {
      // First get current cart
      const cartResponse = await getMyCart();
      if (!cartResponse.cart) {
        throw new Error("No active cart found");
      }
      
      const response = await clearCart(cartResponse.cart.id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to clear cart");
    }
  }
);

// Define the state interface
interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  lastAction: string | null;
  checkoutLoading: boolean;
  checkoutError: string | null;
  priceUpdateLoading: boolean;
  priceUpdateError: string | null;
}

const initialState: CartState = {
  cart: null, // Changed from empty cart object to null
  loading: false,
  error: null,
  lastAction: null,
  checkoutLoading: false,
  checkoutError: null,
  priceUpdateLoading: false,
  priceUpdateError: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.cart = null; // Completely clear the cart including customer data
      state.error = null;
      state.lastAction = null;
      state.priceUpdateError = null;
      state.checkoutError = null;
      state.checkoutLoading = false;
      state.priceUpdateLoading = false;
    },
    clearError: (state) => {
      state.error = null;
      state.checkoutError = null;
      state.priceUpdateError = null;
    },
    clearLastAction: (state) => {
      state.lastAction = null;
    },
    // Optimistic updates for better UX
    incrementItemQuantity: (state, action: PayloadAction<string>) => {
      if (state.cart && state.cart.items) {
        const item = state.cart.items.find(item => item.id === action.payload);
        if (item) {
          item.quantity += 1;
          item.totalPrice = item.unitPrice * item.quantity;
          state.cart.totalItems += 1;
          state.cart.totalAmount += item.unitPrice;
        }
      }
    },
    decrementItemQuantity: (state, action: PayloadAction<string>) => {
      if (state.cart && state.cart.items) {
        const item = state.cart.items.find(item => item.id === action.payload);
        if (item && item.quantity > 1) {
          item.quantity -= 1;
          item.totalPrice = item.unitPrice * item.quantity;
          state.cart.totalItems -= 1;
          state.cart.totalAmount -= item.unitPrice;
        }
      }
    },
    // Optimistic update for price
    updateItemPriceOptimistic: (state, action: PayloadAction<{ itemId: string; unitPrice: number }>) => {
      if (state.cart && state.cart.items) {
        const item = state.cart.items.find(item => item.id === action.payload.itemId);
        if (item) {
          const oldTotalPrice = item.totalPrice;
          item.unitPrice = action.payload.unitPrice;           // Direct mutation
          item.totalPrice = item.unitPrice * item.quantity;    // Direct mutation
          
          const priceDiff = item.totalPrice - oldTotalPrice;
          state.cart.totalAmount += priceDiff;                 // Direct mutation
        }
      }
    },
    removeItemOptimistic: (state, action: PayloadAction<string>) => {
      if (state.cart) {
        const itemIndex = state.cart.items.findIndex(item => item.id === action.payload);
        if (itemIndex !== -1) {
          const item = state.cart.items[itemIndex];
          state.cart.totalItems -= item.quantity;
          state.cart.totalAmount -= item.totalPrice;
          state.cart.items.splice(itemIndex, 1);
        }
      }
    },
    // New action to clear customer from cart
    clearCustomerFromCart: (state) => {
      if (state.cart) {
        state.cart.customerId = undefined; // Clear customer ID
        // Also clear any customer-related fields if they exist in your cart structure
        // For example:
        // state.cart.customer = undefined;
        // state.cart.customerName = undefined;
        // state.cart.customerPhone = undefined;
        // etc.
      }
    },
    setCheckoutLoading: (state, action: PayloadAction<boolean>) => {
      state.checkoutLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Cart
      .addCase(fetchMyCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCart.fulfilled, (state, action: PayloadAction<CartResponse>) => {
        state.loading = false;
        state.cart = action.payload.cart;
        state.error = null;
        state.lastAction = "fetch";
       
      })
      .addCase(fetchMyCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.cart = null;
      })
      // Fetch Cart By ID With Filter
      .addCase(fetchCartByIdWithFilter.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartByIdWithFilter.fulfilled, (state, action: PayloadAction<CartResponse>) => {
        state.loading = false;
        state.cart = action.payload.cart;
        state.error = null;
        state.lastAction = "fetchById";
      })
      .addCase(fetchCartByIdWithFilter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Item To User Cart
      .addCase(addItemToUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToUserCart.fulfilled, (state, action: PayloadAction<CartItemResponse>) => {
        state.loading = false;
        
        // Refresh cart data after adding item
        if (state.cart) {
          // Ensure items array exists
          if (!state.cart.items) {
            state.cart.items = [];
          }
          
          // Optimistically update cart
          state.cart.items.push(action.payload.cartItem);
          state.cart.totalItems += action.payload.cartItem.quantity;
          state.cart.totalAmount += action.payload.cartItem.totalPrice;
        } else {
          // If no cart existed, create a new one with proper structure
          state.cart = { 
            id: action.payload.cartItem.cartId,
            userId: "", // Will be populated on next fetch
            totalItems: action.payload.cartItem.quantity,
            totalAmount: action.payload.cartItem.totalPrice,
            isCheckedOut: false,
            items: [action.payload.cartItem]
          } as Cart;
        }
        
        state.error = null;
        state.lastAction = "addItem";
      })
      .addCase(addItemToUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Cart Item Quantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action: PayloadAction<CartItemResponse>) => {
        state.loading = false;
        if (state.cart) {
          const itemIndex = state.cart.items.findIndex(item => item.id === action.payload.cartItem.id);
          if (itemIndex !== -1) {
            const oldItem = state.cart.items[itemIndex];
            const quantityDiff = action.payload.cartItem.quantity - oldItem.quantity;
            const amountDiff = action.payload.cartItem.totalPrice - oldItem.totalPrice;
            
            state.cart.items[itemIndex] = action.payload.cartItem;
            state.cart.totalItems += quantityDiff;
            state.cart.totalAmount += amountDiff;
          }
        }
        state.error = null;
        state.lastAction = "updateQuantity";
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Cart Item Price
      .addCase(updateCartItemPrice.pending, (state) => {
        state.priceUpdateLoading = true;
        state.priceUpdateError = null;
      })
      .addCase(updateCartItemPrice.fulfilled, (state, action: PayloadAction<CartItemResponse>) => {
        state.priceUpdateLoading = false;
        if (state.cart) {
          const newItem = action.payload.cartItem;
          
          // Find the index of the item to replace
          const itemIndex = state.cart.items.findIndex(item => 
            item.productId === newItem.productId && 
            item.shopId === newItem.shopId
          );
          
          if (itemIndex !== -1) {
            // Replace the item at the found index
            state.cart.items[itemIndex] = newItem;
            
            // Recalculate totals
            state.cart.totalItems = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
            state.cart.totalAmount = state.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
          }
        }
        state.priceUpdateError = null;
        state.lastAction = "updatePrice";
      })
      .addCase(updateCartItemPrice.rejected, (state, action) => {
        state.priceUpdateLoading = false;
        state.priceUpdateError = action.payload as string;
        // Refresh cart to restore original state
        state.loading = true;
      })
      // Remove Cart Item
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action: PayloadAction<MessageResponse>) => {
        state.loading = false;
        // The cart totals will be updated when we refetch, but we can optimistically remove
        state.error = null;
        state.lastAction = "removeItem";
        // Refetch cart to get updated totals
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Checkout User Cart
      .addCase(checkoutUserCart.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutError = null;
      })
      .addCase(checkoutUserCart.fulfilled, (state, action: PayloadAction<CheckoutResponse>) => {
        state.checkoutLoading = false;
        state.cart = action.payload.cart; // This will be the checked out cart
        state.checkoutError = null;
        state.lastAction = "checkout";
      })
      .addCase(checkoutUserCart.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = action.payload as string;
      })
      // Clear User Cart - UPDATED to also clear customer
      .addCase(clearUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearUserCart.fulfilled, (state, action: PayloadAction<MessageResponse>) => {
        state.loading = false;
        if (state.cart) {
          // Clear items and reset totals
          state.cart.items = [];
          state.cart.totalItems = 0;
          state.cart.totalAmount = 0;
          
          // IMPORTANT: Also clear the customer from the cart
          state.cart.customerId = undefined;
          
          // Clear any other customer-related fields if they exist
          // For example:
          // state.cart.customer = undefined;
          // state.cart.customerName = undefined;
          // state.cart.customerPhone = undefined;
          // state.cart.discount = 0; // Also reset discount if applicable
          // state.cart.notes = ""; // Clear notes if applicable
        }
        state.error = null;
        state.lastAction = "clear";
      })
      .addCase(clearUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearCart: clearCartAction,
  clearError, 
  clearLastAction,
  incrementItemQuantity,
  decrementItemQuantity,
  updateItemPriceOptimistic,
  removeItemOptimistic,
  clearCustomerFromCart, // Export the new action
  setCheckoutLoading,
} = cartSlice.actions;

// Selectors
const selectCartState = (state: { cart: CartState }) => state.cart;

export const selectCart = createSelector(
  [selectCartState],
  (state) => state.cart
);

export const selectCartItems = createSelector(
  [selectCart],
  (cart) => cart?.items || []
);

export const selectCartLoading = createSelector(
  [selectCartState],
  (state) => state.loading
);

export const selectCartError = createSelector(
  [selectCartState],
  (state) => state.error
);

export const selectLastAction = createSelector(
  [selectCartState],
  (state) => state.lastAction
);

export const selectCheckoutLoading = createSelector(
  [selectCartState],
  (state) => state.checkoutLoading
);

export const selectCheckoutError = createSelector(
  [selectCartState],
  (state) => state.checkoutError
);

export const selectPriceUpdateLoading = createSelector(
  [selectCartState],
  (state) => state.priceUpdateLoading
);

export const selectPriceUpdateError = createSelector(
  [selectCartState],
  (state) => state.priceUpdateError
);

export const selectCartTotalItems = createSelector(
  [selectCart],
  (cart) => cart?.totalItems || 0
);

export const selectCartTotalAmount = createSelector(
  [selectCart],
  (cart) => cart?.totalAmount || 0
);

export const selectCartItemCount = createSelector(
  [selectCartItems],
  (items) => items.length
);

// New selector to get customer ID from cart
export const selectCartCustomerId = createSelector(
  [selectCart],
  (cart) => cart?.customerId || undefined
);

// New selector to check if cart has a customer
export const selectCartHasCustomer = createSelector(
  [selectCartCustomerId],
  (customerId) => customerId !== undefined
);

export const selectCartItemById = (itemId: string) => 
  createSelector(
    [selectCartItems],
    (items) => items.find(item => item.id === itemId)
  );

export const selectCartItemsByShop = (shopId: string) =>
  createSelector(
    [selectCartItems],
    (items) => items.filter(item => item.shopId === shopId)
  );

export const selectCartItemsByProduct = (productId: string) =>
  createSelector(
    [selectCartItems],
    (items) => items.filter(item => item.productId === productId)
  );

export const selectIsProductInCart = (productId: string) =>
  createSelector(
    [selectCartItems],
    (items) => items.some(item => item.productId === productId)
  );

export const selectCartItemQuantity = (productId: string) =>
  createSelector(
    [selectCartItems],
    (items) => {
      const item = items.find(item => item.productId === productId);
      return item ? item.quantity : 0;
    }
  );

export const selectShopsInCart = createSelector(
  [selectCartItems],
  (items) => {
    const shopIds = items.map(item => item.shopId);
    return Array.from(new Set(shopIds));
  }
);

export const selectIsCartEmpty = createSelector(
  [selectCartItems],
  (items) => items.length === 0
);

export const selectIsCartCheckedOut = createSelector(
  [selectCart],
  (cart) => cart?.isCheckedOut || false
);

export default cartSlice.reducer;