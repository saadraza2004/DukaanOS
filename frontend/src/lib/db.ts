import Dexie, { Table } from 'dexie';
import { Product, Customer, CreateSalePayload } from '../types';

export interface QueuedSale {
  id?: number;
  clientSaleId: string;
  payload: CreateSalePayload;
  queuedAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

export class DukaanLocalDatabase extends Dexie {
  products!: Table<Product, number>;
  customers!: Table<Customer, number>;
  salesQueue!: Table<QueuedSale, number>;

  constructor() {
    super('DukaanOS_LocalDB');
    this.version(1).stores({
      products: 'id, name, barcode, sku, categoryId',
      customers: 'id, name, phone, currentBalance',
      salesQueue: '++id, clientSaleId, status, queuedAt',
    });
  }
}

export const localDb = new DukaanLocalDatabase();
