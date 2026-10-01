import { StockResult, PlatformChecker, createBaseResult, fetchWithRetry, sleep } from './base';
import { ProductConfig } from '../config';
import * as cheerio from 'cheerio';

export async function checkZepto(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('zepto', product.id, product.name);
  
  if (!product.urls.zepto) {
    result.error = 'No Zepto URL configured';
    return result;
  }

  try {
    const url = product.urls.zepto;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    };

    const response = await fetchWithRetry(url, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Zepto stock indicators
    const outOfStockSelectors = [
      'button:contains("Out of Stock")',
      'button:contains("Notify Me")',
      '.out-of-stock',
      '[data-testid="out-of-stock"]',
      '.product-unavailable',
      'span:contains("OUT OF STOCK")',
      'div:contains("Currently Unavailable")',
      'button:disabled:contains("Add")',
    ];

    let isOutOfStock = false;
    for (const selector of outOfStockSelectors) {
      if ($(selector).length > 0) {
        isOutOfStock = true;
        break;
      }
    }

    const inStockSelectors = [
      'button:contains("Add to Cart")',
      'button:contains("Add to cart")',
      'button:contains("ADD TO CART")',
      '[data-testid="add-to-cart"]',
      '.add-to-cart',
      'button[type="submit"]:not(:disabled)',
    ];

    let isInStock = false;
    for (const selector of inStockSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        // Check if button is not disabled
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          if (!$(el).is(':disabled') && !$(el).hasClass('disabled')) {
            isInStock = true;
            break;
          }
        }
      }
      if (isInStock) break;
    }

    // Extract price
    const priceSelectors = [
      '[data-testid="price"]',
      '.price',
      '.product-price',
      '.selling-price',
      'span:contains("₹")',
      'h3:contains("₹")',
    ];

    let price: number | undefined;
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text();
        const match = text.match(/₹\s*([\d,]+)/);
        if (match) {
          price = parseInt(match[1].replace(/,/g, ''), 10);
          break;
        }
      }
    }

    // Product name
    const nameSelectors = [
      'h1[data-testid="product-name"]',
      'h1.product-name',
      '.product-title',
      'h1',
    ];

    let productName = product.name;
    for (const selector of nameSelectors) {
      const element = $(selector).first();
      if (element.length > 0 && element.text().trim()) {
        productName = element.text().trim();
        break;
      }
    }

    result.productName = productName;
    result.price = price;
    result.currency = 'INR';

    if (isOutOfStock && !isInStock) {
      result.available = false;
      result.stockLevel = 'out_of_stock';
    } else if (isInStock && !isOutOfStock) {
      result.available = true;
      result.stockLevel = 'in_stock';
    } else {
      // Check JSON-LD
      const jsonLd = $('script[type="application/ld+json"]').map((_, el) => {
        try {
          return JSON.parse($(el).html() || '');
        } catch {
          return null;
        }
      }).get();

      for (const data of jsonLd) {
        if (data && data['@type'] === 'Product') {
          if (data.offers && data.offers.availability) {
            const availability = data.offers.availability.toLowerCase();
            if (availability.includes('instock')) {
              result.available = true;
              result.stockLevel = 'in_stock';
            } else if (availability.includes('outofstock')) {
              result.available = false;
              result.stockLevel = 'out_of_stock';
            }
          }
          if (data.offers && data.offers.price) {
            result.price = parseFloat(data.offers.price);
          }
          break;
        }
      }

      if (result.stockLevel === 'unknown') {
        result.error = 'Could not determine stock status from page';
      }
    }

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.available = false;
    result.stockLevel = 'unknown';
  }

  return result;
}

// Zepto API approach (they use a different API structure)
export async function checkZeptoAPI(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('zepto', product.id, product.name);
  
  if (!product.urls.zepto) {
    result.error = 'No Zepto URL configured';
    return result;
  }

  // Extract product ID from URL
  const urlMatch = product.urls.zepto.match(/\/p\/([^\/]+)/);
  const productId = urlMatch ? urlMatch[1] : null;

  if (!productId) {
    result.error = 'Could not extract product ID from URL';
    return result;
  }

  try {
    // Zepto's API endpoint
    const apiUrl = `https://www.zepto.com/api/v1/products/${productId}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'x-zepto-platform': 'web',
      'x-zepto-city': 'DEL', // Would need to map pincode to city code
    };

    const response = await fetchWithRetry(apiUrl, { headers });
    
    if (response.ok) {
      const data = await response.json() as { product?: any };
      if (data && data.product) {
        const p = data.product;
        result.productName = p.name || product.name;
        result.price = p.price;
        result.currency = 'INR';
        result.available = p.available === true;
        result.stockLevel = p.available ? 'in_stock' : 'out_of_stock';
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'API check failed';
  }

  return result;
}