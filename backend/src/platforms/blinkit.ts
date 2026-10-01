import { StockResult, PlatformChecker, createBaseResult, fetchWithRetry, sleep } from './base';
import { ProductConfig } from '../config';
import * as cheerio from 'cheerio';

export async function checkBlinkit(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('blinkit', product.id, product.name);
  
  if (!product.urls.blinkit) {
    result.error = 'No Blinkit URL configured';
    return result;
  }

  try {
    // Blinkit uses GraphQL API - we'll try the product page first
    const url = product.urls.blinkit;
    
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
      'Cache-Control': 'max-age=0',
    };

    // Try to get product page
    const response = await fetchWithRetry(url, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Check for common out-of-stock indicators
    const outOfStockSelectors = [
      'button:contains("Out of Stock")',
      'button:contains("Notify Me")',
      '.out-of-stock',
      '[data-testid="out-of-stock"]',
      '.product-unavailable',
      'span:contains("OUT OF STOCK")',
      'div:contains("This item is currently unavailable")',
    ];

    let isOutOfStock = false;
    for (const selector of outOfStockSelectors) {
      if ($(selector).length > 0) {
        isOutOfStock = true;
        break;
      }
    }

    // Check for in-stock indicators
    const inStockSelectors = [
      'button:contains("Add to Cart")',
      'button:contains("Buy Now")',
      '[data-testid="add-to-cart"]',
      '.add-to-cart-btn',
      'button:contains("ADD TO CART")',
    ];

    let isInStock = false;
    for (const selector of inStockSelectors) {
      if ($(selector).length > 0) {
        isInStock = true;
        break;
      }
    }

    // Try to extract price
    const priceSelectors = [
      '[data-testid="price"]',
      '.price',
      '.product-price',
      'span:contains("₹")',
      'div:contains("₹")',
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

    // Try to find product name from page
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
      // Ambiguous - check for JSON-LD structured data
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
            if (availability.includes('instock') || availability.includes('in_stock')) {
              result.available = true;
              result.stockLevel = 'in_stock';
            } else if (availability.includes('outofstock') || availability.includes('out_of_stock')) {
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

// Alternative: Try Blinkit's API directly (if we can find the right endpoint)
export async function checkBlinkitAPI(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('blinkit', product.id, product.name);
  
  if (!product.urls.blinkit) {
    result.error = 'No Blinkit URL configured';
    return result;
  }

  // Extract product ID from URL
  const urlMatch = product.urls.blinkit.match(/\/product\/([^\/]+)/);
  const productSlug = urlMatch ? urlMatch[1] : null;

  if (!productSlug) {
    result.error = 'Could not extract product ID from URL';
    return result;
  }

  try {
    // Blinkit's GraphQL endpoint (may require auth)
    const graphqlUrl = 'https://blinkit.com/v6/graphql';
    
    const query = `
      query GetProduct($slug: String!) {
        product(slug: $slug) {
          id
          name
          price
          mrp
          inventory {
            available
            quantity
          }
        }
      }
    `;

    const response = await fetchWithRetry(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { slug: productSlug },
      }),
    });

    if (response.ok) {
      const data = await response.json() as { data?: { product?: any } };
      if (data.data && data.data.product) {
        const p = data.data.product;
        result.productName = p.name || product.name;
        result.price = p.price;
        result.currency = 'INR';
        result.available = p.inventory?.available === true;
        result.stockLevel = p.inventory?.available ? 'in_stock' : 'out_of_stock';
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'API check failed';
  }

  return result;
}