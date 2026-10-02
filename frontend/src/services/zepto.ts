import { ProductStatus } from '@/types/product';

export async function checkZepto(url: string): Promise<ProductStatus> {
  const result: ProductStatus = {
    available: null,
    price: undefined,
    name: undefined,
    image: undefined,
    checkedAt: new Date().toISOString(),
    status: 'CHECK_FAILED',
    error: 'Unable to check automatically',
  };

  try {
    // Zepto uses dynamic rendering and has anti-bot protection
    // Direct browser requests will fail due to CORS and bot detection
    result.error = 'Zepto blocks browser-based requests due to anti-bot protection';
    result.status = 'CHECK_FAILED';
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'CHECK_FAILED';
    return result;
  }
}

export function isZeptoUrl(url: string): boolean {
  return /zepto\.com/i.test(url);
}

export function getZeptoSearchUrl(query: string): string {
  return `https://www.zepto.com/search?q=${encodeURIComponent(query)}`;
}