import { ProductStatus, Platform, AvailabilityStatus } from '@/types/product';
import { checkBlinkit } from './blinkit';
import { checkZepto } from './zepto';
import { checkFirstCry } from './firstcry';
import { checkAmazon } from './amazon';

export async function checkProductAvailability(
  url: string,
  platform: Platform
): Promise<ProductStatus> {
  switch (platform) {
    case 'blinkit':
      return checkBlinkit(url);
    case 'zepto':
      return checkZepto(url);
    case 'firstcry':
      return checkFirstCry(url);
    case 'amazon':
      return checkAmazon(url);
    default:
      return {
        available: null,
        price: undefined,
        name: undefined,
        image: undefined,
        checkedAt: new Date().toISOString(),
        status: 'CHECK_FAILED',
        error: `Unknown platform: ${platform}`,
      };
  }
}

export function createDefaultStatus(): ProductStatus {
  return {
    available: null,
    price: undefined,
    name: undefined,
    image: undefined,
    checkedAt: new Date().toISOString(),
    status: 'UNKNOWN',
  };
}

export function determineStatus(available: boolean | null, error?: string): AvailabilityStatus {
  if (error) return 'CHECK_FAILED';
  if (available === null) return 'UNKNOWN';
  return available ? 'IN_STOCK' : 'OUT_OF_STOCK';
}