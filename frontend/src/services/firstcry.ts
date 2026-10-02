import { ProductStatus } from '@/types/product';

export async function checkFirstCry(url: string): Promise<ProductStatus> {
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
    // FirstCry uses dynamic rendering and has anti-bot protection
    // Direct browser requests will fail due to CORS and bot detection
    result.error = 'FirstCry blocks browser-based requests due to anti-bot protection';
    result.status = 'CHECK_FAILED';
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'CHECK_FAILED';
    return result;
  }
}

export function isFirstCryUrl(url: string): boolean {
  return /firstcry\.com/i.test(url);
}

export function getFirstCrySearchUrl(query: string): string {
  return `https://www.firstcry.com/search?q=${encodeURIComponent(query)}`;
}