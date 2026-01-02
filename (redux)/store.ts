import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
// import topSellingProductsReducer from "./topSellingProducts";
// import categoriesReducer from "./catagory"
import cartSliceReducer  from "./CART"
import shopServiceReducer from "./shopService"
// import userSellsReducer from "./sell"
import customersSliceReducer from "./customer"
// import subcategoryProductsReducer from "./subcatagory"
// import productBatchesReducer from "./productBatches";
import waitlistReducer from "./WaitlistCart"
const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartSliceReducer,
    shops: shopServiceReducer,
    // userSells: userSellsReducer, // Add the user sells reducer
customers: customersSliceReducer,
// subcategoryProducts: subcategoryProductsReducer,
    // productBatches: productBatchesReducer, // Add the product batches reducer
    waitlist: waitlistReducer, 
  },
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware({
  //     serializableCheck: false, // Disables the check entirely
  //     // OR increase the threshold:
  //     // serializableCheck: { warnAfter: 128 }, 
  //     immutableCheck: false,    // Also helps performance in dev
  //   }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
