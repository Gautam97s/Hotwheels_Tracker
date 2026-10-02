import { TrackedProduct, ProductStatus, AvailabilityStatus } from '@/types/product';
import { generateId } from '@/lib/utils';

const STORAGE_KEY = 'hotwheels-tracked-products';
const SETTINGS_KEY = 'hotwheels-settings';

export interface AppSettings {
  globalCheckInterval: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: AppSettings = {
  globalCheckInterval: 5 * 60 * 1000,
  notificationsEnabled: false,
  soundEnabled: false,
  theme: 'system',
};

export function getStoredProducts(): TrackedProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((p: any) => ({
      ...p,
      status: p.status || getDefaultStatus(),
    }));
  } catch {
    return [];
  }
}

export function saveProducts(products: TrackedProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save products:', error);
  }
}

export function addProduct(product: Omit<TrackedProduct, 'id' | 'createdAt' | 'updatedAt' | 'status'>): TrackedProduct {
  const products = getStoredProducts();
  const now = new Date().toISOString();
  const newProduct: TrackedProduct = {
    ...product,
    id: generateId(),
    status: getDefaultStatus(),
    createdAt: now,
    updatedAt: now,
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<TrackedProduct>): TrackedProduct | null {
  const products = getStoredProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveProducts(products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getStoredProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  saveProducts(filtered);
  return true;
}

export function updateProductStatus(id: string, status: ProductStatus): TrackedProduct | null {
  const products = getStoredProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  const previousStatus = products[index].status.status;
  const newStatus = status.status;
  const now = new Date().toISOString();
  
  products[index] = {
    ...products[index],
    status: {
      ...products[index].status,
      ...status,
      checkedAt: now,
    },
    updatedAt: now,
    lastSuccessfulCheck: status.error ? products[index].lastSuccessfulCheck : now,
    lastStatusChange: previousStatus !== newStatus ? now : products[index].lastStatusChange,
  };
  
  saveProducts(products);
  return products[index];
}

export function getDefaultStatus(): ProductStatus {
  return {
    available: null,
    price: undefined,
    name: undefined,
    image: undefined,
    checkedAt: new Date().toISOString(),
    status: 'UNKNOWN',
  };
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const current = getSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
  return updated;
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}