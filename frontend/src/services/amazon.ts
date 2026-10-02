import { ProductStatus } from '@/types/product';

export async function checkAmazon(url: string): Promise<ProductStatus> {
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
    // Amazon has very strong anti-bot protection and CORS restrictions
    // Direct browser requests will fail
    result.error = 'Amazon blocks browser-based requests due to anti-bot protection';
    result.status = 'CHECK_FAILED';
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'CHECK_FAILED';
    return result;
  }
}

export function isAmazonUrl(url: string): boolean {
  return /amazon\.in/i.test(url);
}

export function getAmazonSearchUrl(query: string): string {
  return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
}