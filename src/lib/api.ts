import {
  User,
  Product,
  Category,
  InventoryBatch,
  InventoryMovement,
  PriceHistory,
  Sale,
  CreateSalePayload,
  Customer,
  CustomerLedger,
  DashboardStats,
  DashboardCharts,
  DayClosingSummary,
  DayClosingRecord,
  AiChatResponse
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('dukaanos_token');
  }

  public static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dukaanos_token', token);
    }
  }

  public static clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dukaanos_token');
      localStorage.removeItem('dukaanos_user');
    }
  }

  public static getSavedUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('dukaanos_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static saveUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dukaanos_user', JSON.stringify(user));
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorData.title || JSON.stringify(errorData);
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  public static async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    this.saveUser(data.user);
    return data;
  }

  public static async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Products
  public static async getProducts(search?: string, categoryId?: number, lowStockOnly = false): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId.toString());
    if (lowStockOnly) params.append('lowStockOnly', 'true');
    return this.request<Product[]>(`/products?${params.toString()}`);
  }

  public static async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/products/categories');
  }

  public static async createProduct(payload: unknown): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async updatePrice(productId: number, newPrice: number): Promise<Product> {
    return this.request<Product>(`/products/${productId}/price`, {
      method: 'PUT',
      body: JSON.stringify({ newPrice }),
    });
  }

  public static async getPriceHistory(productId: number): Promise<PriceHistory[]> {
    return this.request<PriceHistory[]>(`/products/${productId}/price-history`);
  }

  // Inventory
  public static async getBatches(productId?: number): Promise<InventoryBatch[]> {
    const query = productId ? `?productId=${productId}` : '';
    return this.request<InventoryBatch[]>(`/inventory/batches${query}`);
  }

  public static async createBatch(payload: unknown): Promise<InventoryBatch> {
    return this.request<InventoryBatch>('/inventory/batches', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async adjustStock(payload: { productId: number; batchId?: number; quantityMajorUnit: number; reason: string; notes?: string }): Promise<void> {
    await this.request<void>('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async getMovements(productId?: number, limit = 100): Promise<InventoryMovement[]> {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId.toString());
    params.append('limit', limit.toString());
    return this.request<InventoryMovement[]>(`/inventory/movements?${params.toString()}`);
  }

  // Sales
  public static async createSale(payload: CreateSalePayload): Promise<Sale> {
    return this.request<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async getRecentSales(limit = 50): Promise<Sale[]> {
    return this.request<Sale[]>(`/sales/recent?limit=${limit}`);
  }

  public static async getSaleById(id: string): Promise<Sale> {
    return this.request<Sale>(`/sales/${id}`);
  }

  // Customers & Udhaar
  public static async getCustomers(search?: string): Promise<Customer[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Customer[]>(`/customers${query}`);
  }

  public static async getTopDebtors(limit = 10): Promise<Customer[]> {
    return this.request<Customer[]>(`/customers/top-debtors?limit=${limit}`);
  }

  public static async createCustomer(payload: { name: string; phone?: string; address?: string; maxCreditLimit?: number; notes?: string }): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async getCustomerLedger(customerId: number): Promise<CustomerLedger[]> {
    return this.request<CustomerLedger[]>(`/customers/${customerId}/ledger`);
  }

  public static async recordCustomerPayment(customerId: number, payload: { amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }): Promise<Customer> {
    return this.request<Customer>(`/customers/${customerId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Dashboard
  public static async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  public static async getDashboardCharts(): Promise<DashboardCharts> {
    return this.request<DashboardCharts>('/dashboard/charts');
  }

  // Day Closing
  public static async getDayClosingSummary(openingCash = 0): Promise<DayClosingSummary> {
    return this.request<DayClosingSummary>(`/dayclosing/summary?openingCash=${openingCash}`);
  }

  public static async submitDayClosing(payload: { openingCash: number; actualCashCounted: number; notes?: string }): Promise<DayClosingRecord> {
    return this.request<DayClosingRecord>('/dayclosing/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async getDayClosingHistory(limit = 30): Promise<DayClosingRecord[]> {
    return this.request<DayClosingRecord[]>(`/dayclosing/history?limit=${limit}`);
  }

  // AI Assistant
  public static async askAi(message: string): Promise<AiChatResponse> {
    return this.request<AiChatResponse>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Sync Batch
  public static async syncSalesBatch(sales: CreateSalePayload[]): Promise<{ syncedCount: number; duplicateSkippedCount: number; processedSaleIds: string[] }> {
    return this.request<{ syncedCount: number; duplicateSkippedCount: number; processedSaleIds: string[] }>('/sync/sales-batch', {
      method: 'POST',
      body: JSON.stringify({ sales }),
    });
  }
}
