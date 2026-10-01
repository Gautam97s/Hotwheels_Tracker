export interface StockResult {
  platform: 'blinkit' | 'zepto' | 'firstcry' | 'amazon';
  productId: string;
  productName: string;
  available: boolean;
  price?: number;
  currency?: string;
  stockLevel?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  checkedAt: string;
  error?: string;
  rawData?: any;
}

export interface PlatformChecker {
  check(product: import('../config').ProductConfig): Promise<StockResult>;
}

export function createBaseResult(platform: StockResult['platform'], productId: string, productName: string): StockResult {
  return {
    platform,
    productId,
    productName,
    available: false,
    checkedAt: new Date().toISOString(),
    stockLevel: 'unknown',
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retries) throw error;
      await sleep(delay * (i + 1));
    }
  }
  throw new Error('Max retries exceeded');
}