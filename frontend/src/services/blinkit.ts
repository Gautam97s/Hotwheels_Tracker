import { ProductStatus, AvailabilityStatus } from '@/types/product';

export async function checkBlinkit(url: string): Promise<ProductStatus> {
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
    // Blinkit uses dynamic rendering and has strong anti-bot protection
    // Direct browser requests will fail due to CORS and bot detection
    // We'll return CHECK_FAILED with a helpful message
    
    result.error = 'Blinkit blocks browser-based requests due to anti-bot protection';
    result.status = 'CHECK_FAILED';
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'CHECK_FAILED';
    return result;
  }
}

export function isBlinkitUrl(url: string): boolean {
  return /blinkit\.com/i.test(url);
}

export function getBlinkitSearchUrl(query: string): string {
  return `https://blinkit.com/search?q=${encodeURIComponent(query)}`;
}