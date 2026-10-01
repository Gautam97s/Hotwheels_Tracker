import * as fs from 'fs';
import * as path from 'path';
import { StockResult } from '../platforms/base';

const STATUS_FILE = path.join(__dirname, 'status.json');

export interface StatusRecord {
  productId: string;
  productName: string;
  lastCheck: string;
  results: StockResult[];
  lastInStockCheck?: string;
  consecutiveOutOfStock: number;
}

export interface StatusStore {
  [productId: string]: StatusRecord;
}

export function loadStatus(): StatusStore {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
      return data;
    }
  } catch (error) {
    console.warn('Failed to load status, starting fresh:', error);
  }
  return {};
}

export function saveStatus(store: StatusStore): void {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('Failed to save status:', error);
  }
}

export function updateStatus(
  store: StatusStore,
  productId: string,
  productName: string,
  results: StockResult[]
): StatusStore {
  const now = new Date().toISOString();
  const previous = store[productId];
  
  const inStock = results.some(r => r.available);
  const wasInStock = previous?.results.some(r => r.available) ?? false;

  const record: StatusRecord = {
    productId,
    productName,
    lastCheck: now,
    results,
    lastInStockCheck: inStock ? now : previous?.lastInStockCheck,
    consecutiveOutOfStock: inStock ? 0 : (previous?.consecutiveOutOfStock ?? 0) + 1,
  };

  return {
    ...store,
    [productId]: record,
  };
}

export function getPreviousResults(store: StatusStore, productId: string): StockResult[] {
  return store[productId]?.results ?? [];
}

export function getStatusSummary(store: StatusStore): string {
  const entries = Object.values(store);
  if (entries.length === 0) return 'No products tracked';

  let summary = `📦 <b>Tracking ${entries.length} product(s)</b>\n\n`;
  
  for (const entry of entries) {
    const inStock = entry.results.filter(r => r.available).length;
    const total = entry.results.length;
    const lastCheck = new Date(entry.lastCheck).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    summary += `${inStock > 0 ? '✅' : '❌'} <b>${entry.productName}</b>\n`;
    summary += `   ${inStock}/${total} in stock | Last: ${lastCheck}\n`;
    if (entry.lastInStockCheck) {
      const lastInStock = new Date(entry.lastInStockCheck).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      summary += `   Last in stock: ${lastInStock}\n`;
    }
    summary += `\n`;
  }

  return summary;
}