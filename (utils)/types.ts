export enum SaleStatus {
  NOT_APPROVED = "NOT_APPROVED",
  PARTIALLY_DELIVERED = "PARTIALLY_DELIVERED",
  APPROVED = "APPROVED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED"
}

export enum ItemSaleStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED"
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol?: string;
  base?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  branchId: string;
  branch: Branch;
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  expiryDate?: string;
    product?: Product;
      productId?: string;


}

// Add Product interface
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  image?: string;
}

export interface SellItemBatch {
  id: string;
  sellItemId: string;
  batchId: string;
  batch: ProductBatch;
  quantity: number; // quantity taken from this batch
}

export interface SellItem {
  id: string;
  sellId: string;
  sell?: Sell;

  productId: string;
  product: Product;

  shopId: string;
  shop: Shop;

  unitOfMeasureId: string;
  unitOfMeasure: UnitOfMeasure;

  itemSaleStatus: ItemSaleStatus; // PENDING / DELIVERED

  quantity: number;
  unitPrice: number;
  totalPrice: number;

  createdAt: string;
  updatedAt: string;

  // ✅ New: batches (from sell_item_batches)
  batches: SellItemBatch[];
}

export interface Sell {
  locked: any;
  id: string;
  invoiceNo: string;
  saleStatus: SaleStatus; // NOT_APPROVED, PARTIALLY_DELIVERED, APPROVED, DELIVERED, CANCELLED

  branchId?: string;
  branch?: Branch;

  customerId?: string;
  customer?: Customer;

  totalProducts: number;
  subTotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  NetTotal: number;

  notes?: string;
  saleDate: string;

  createdById?: string;
  createdBy?: User;
  updatedById?: string;
  updatedBy?: User;

  createdAt: string;
  updatedAt: string;

  items: SellItem[];

  _count: {
    items: number;
  };
}

export interface GetAllSellsUserParams {
  status: any;
  customerId: any;
  startDate?: string;
  endDate?: string;
  userId: string;
}

export interface GetAllSellsUserResponse {
  meta: any;
  success: boolean;
  sells: Sell[];
  count: number;
}