import { localDb, QueuedSale } from './db';
import { ApiClient } from './api';
import { SyncState, CreateSalePayload, Product, Customer } from '../types';

type SyncListener = (state: SyncState, pendingCount: number) => void;

class SyncManager {
  private state: SyncState = 'ONLINE';
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.state = navigator.onLine ? 'ONLINE' : 'OFFLINE';

      window.addEventListener('online', () => {
        this.setState('ONLINE');
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.setState('OFFLINE');
      });

      // Periodic check every 15 seconds
      setInterval(() => {
        if (navigator.onLine && this.state !== 'SYNCING') {
          this.checkPendingAndSync();
        }
      }, 15000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.getPendingCount().then((cnt) => listener(this.state, cnt));
    return () => this.listeners.delete(listener);
  }

  public getState(): SyncState {
    return this.state;
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await localDb.salesQueue.where('status').equals('PENDING').count();
    } catch {
      return 0;
    }
  }

  private setState(newState: SyncState): void {
    this.state = newState;
    this.getPendingCount().then((cnt) => {
      this.listeners.forEach((l) => l(this.state, cnt));
    });
  }

  // Queue a sale when offline or network fails
  public async queueOfflineSale(payload: CreateSalePayload): Promise<string> {
    const saleId = payload.clientSaleId || crypto.randomUUID();
    payload.clientSaleId = saleId;

    await localDb.salesQueue.add({
      clientSaleId: saleId,
      payload,
      queuedAt: new Date().toISOString(),
      status: 'PENDING',
    });

    // Locally adjust product stock in IndexedDB
    for (const item of payload.items) {
      const p = await localDb.products.get(item.productId);
      if (p) {
        // approximate decrement
        const deductMajor = item.unitEntered.toUpperCase().startsWith('G')
          ? item.quantityEntered / 1000
          : item.quantityEntered;
        p.currentStockMajorUnit = Math.max(0, p.currentStockMajorUnit - deductMajor);
        await localDb.products.put(p);
      }
    }

    const pending = await this.getPendingCount();
    this.setState(this.state === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');
    this.listeners.forEach((l) => l(this.state, pending));

    return saleId;
  }

  // Sync pending offline sales to the server
  public async triggerSync(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    const pendingSales = await localDb.salesQueue
      .where('status')
      .equals('PENDING')
      .toArray();

    if (pendingSales.length === 0) {
      this.setState('ONLINE');
      return;
    }

    this.isSyncing = true;
    this.setState('SYNCING');

    try {
      const payloads = pendingSales.map((ps) => ps.payload);
      const res = await ApiClient.syncSalesBatch(payloads);

      // Mark processed sales as SYNCED
      for (const sale of pendingSales) {
        if (res.processedSaleIds.includes(sale.clientSaleId)) {
          await localDb.salesQueue.delete(sale.id!);
        }
      }

      this.setState('SYNC COMPLETE');
      setTimeout(() => {
        if (this.state === 'SYNC COMPLETE') {
          this.setState('ONLINE');
        }
      }, 3000);
    } catch {
      this.setState('SYNC ERROR');
    } finally {
      this.isSyncing = false;
    }
  }

  private async checkPendingAndSync(): Promise<void> {
    const count = await this.getPendingCount();
    if (count > 0) {
      await this.triggerSync();
    }
  }

  // Cache catalog locally for offline POS use
  public async cacheCatalogLocally(products: Product[], customers: Customer[]): Promise<void> {
    try {
      await localDb.products.clear();
      await localDb.products.bulkPut(products);

      await localDb.customers.clear();
      await localDb.customers.bulkPut(customers);
    } catch {
      // ignore
    }
  }

  public async getCachedProducts(search?: string): Promise<Product[]> {
    try {
      let items = await localDb.products.toArray();
      if (search && search.trim()) {
        const t = search.trim().toLowerCase();
        items = items.filter(
          (p) =>
            p.name.toLowerCase().includes(t) ||
            p.urduName.includes(t) ||
            p.barcode?.includes(t) ||
            p.sku?.toLowerCase().includes(t)
        );
      }
      return items;
    } catch {
      return [];
    }
  }

  public async getCachedCustomers(): Promise<Customer[]> {
    try {
      return await localDb.customers.toArray();
    } catch {
      return [];
    }
  }
}

export const syncManager = new SyncManager();
