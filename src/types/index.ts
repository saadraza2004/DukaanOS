export type UnitType = 'KG' | 'GRAM' | 'LITRE' | 'ML' | 'PIECE' | 'PACK';
export type UserRole = 'OWNER' | 'CASHIER';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface Product {
  id: number;
  sku?: string;
  barcode?: string;
  name: string;
  urduName: string;
  romanUrduName?: string;
  categoryId: number;
  categoryName: string;
  unitType: UnitType;
  baseUnitRatio: number;
  currentSellingPrice: number;
  minStockThreshold: number;
  currentStockBaseUnit: number;
  currentStockMajorUnit: number;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  urduName: string;
  description?: string;
  displayOrder: number;
}

export interface InventoryBatch {
  id: number;
  batchNumber: string;
  productId: number;
  productName: string;
  supplierName?: string;
  initialQuantityBaseUnit: number;
  remainingQuantityBaseUnit: number;
  remainingQuantityMajorUnit: number;
  costPricePerMajorUnit: number;
  receivedDate: string;
  expiryDate?: string;
  notes?: string;
  isExhausted: boolean;
}

export interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  movementType: string;
  quantityBaseUnit: number;
  quantityMajorUnit: number;
  balanceAfterMajorUnit: number;
  referenceId: string;
  reason?: string;
  notes?: string;
  userFullName: string;
  createdAt: string;
}

export interface PriceHistory {
  id: number;
  productId: number;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy: string;
}

export interface CartItem {
  product: Product;
  quantityEntered: number;
  unitEntered: string;
  quantityInBaseUnit: number;
  sellingPricePerMajorUnit: number;
  lineTotal: number;
}

export interface CreateSalePayload {
  clientSaleId?: string;
  customerId?: number | null;
  items: {
    productId: number;
    quantityEntered: number;
    unitEntered: string;
  }[];
  discountAmount: number;
  paymentMethod: string;
  amountPaid: number;
  paymentReference?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: number | null;
  customerName?: string | null;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: number;
  changeReturned: number;
  udhaarAmount: number;
  totalCostAmount: number;
  profitAmount: number;
  cashierName: string;
  createdAt: string;
  items: {
    id: number;
    productId: number;
    productName: string;
    quantityEntered: number;
    unitEntered: string;
    quantityInBaseUnit: number;
    sellingPricePerMajorUnit: number;
    lineTotal: number;
    allocatedCostTotal: number;
  }[];
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  maxCreditLimit: number;
  currentBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerLedger {
  id: number;
  customerId: number;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  averageBasket: number;
  cashSales: number;
  digitalSales: number;
  creditSales: number;
  totalOutstandingUdhaar: number;
  lowStockItemCount: number;
}

export interface ChartPoint {
  label: string;
  revenue: number;
  profit: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  urduName: string;
  quantitySoldMajorUnit: number;
  unit: string;
  revenue: number;
  profit: number;
}

export interface LowStockAlert {
  productId: number;
  name: string;
  urduName: string;
  currentStockMajorUnit: number;
  minStockThreshold: number;
  unit: string;
}

export interface DashboardCharts {
  dailyTrend: ChartPoint[];
  weeklyTrend: ChartPoint[];
  topSellingProducts: TopProduct[];
  lowStockAlerts: LowStockAlert[];
}

export interface DayClosingSummary {
  closingDate: string;
  openingCash: number;
  cashSales: number;
  digitalSales: number;
  creditSales: number;
  customerCashRecoveries: number;
  totalSales: number;
  totalDiscounts: number;
  totalProfit: number;
  transactionCount: number;
  expectedCash: number;
}

export interface DayClosingRecord {
  id: number;
  closingDate: string;
  openedAt: string;
  closedAt: string;
  openingCash: number;
  cashSales: number;
  digitalSales: number;
  creditSales: number;
  customerCashRecoveries: number;
  totalSales: number;
  totalDiscounts: number;
  totalProfit: number;
  transactionCount: number;
  expectedCash: number;
  actualCashCounted: number;
  shortageOrExcess: number;
  notes?: string;
  closedByUserId: number;
  createdAt: string;
}

export interface AiChatResponse {
  answer: string;
  toolCalled?: string;
  toolData?: unknown;
}

export type SyncState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC COMPLETE' | 'SYNC ERROR';
