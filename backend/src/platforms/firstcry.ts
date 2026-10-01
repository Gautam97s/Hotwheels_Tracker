import { StockResult, createBaseResult, fetchWithRetry } from './base';
import { ProductConfig } from '../config';
import * as cheerio from 'cheerio';

export async function checkFirstCry(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('firstcry', product.id, product.name);
  
  if (!product.urls.firstcry) {
    result.error = 'No FirstCry URL configured';
    return result;
  }

  try {
    const url = product.urls.firstcry;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    const response = await fetchWithRetry(url, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);

    // FirstCry stock indicators
    const outOfStockSelectors = [
      'button:contains("Out of Stock")',
      'button:contains("Notify Me")',
      '.out-of-stock',
      '.stock.out',
      '#btnAddToCart.disabled',
      'button.disabled:contains("Add to Cart")',
      '.product-unavailable',
      'span:contains("OUT OF STOCK")',
      'div:contains("This product is currently unavailable")',
      '.sold-out',
    ];

    let isOutOfStock = false;
    for (const selector of outOfStockSelectors) {
      if ($(selector).length > 0) {
        isOutOfStock = true;
        break;
      }
    }

    const inStockSelectors = [
      '#btnAddToCart:not(.disabled)',
      'button:contains("Add to Cart"):not(.disabled)',
      'button:contains("BUY NOW"):not(.disabled)',
      '.add-to-cart-btn:not(.disabled)',
      '[data-testid="add-to-cart"]:not(.disabled)',
    ];

    let isInStock = false;
    for (const selector of inStockSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          if (!$(el).hasClass('disabled') && !$(el).is(':disabled')) {
            isInStock = true;
            break;
          }
        }
      }
      if (isInStock) break;
    }

    // Check for "Sold Out" text
    const soldOutText = $('body').text();
    if (soldOutText.includes('SOLD OUT') || soldOutText.includes('Sold Out')) {
      isOutOfStock = true;
      isInStock = false;
    }

    // Extract price
    const priceSelectors = [
      '#our_price_display',
      '.price-box .price',
      '.product-price .price',
      '.special-price .price',
      '.price',
      'span:contains("₹")',
      '.mrp-price',
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
      'h1.product-name',
      '.product-title h1',
      'h1[itemprop="name"]',
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

    // Check meta tags for stock
    const availabilityMeta = $('meta[itemprop="availability"]').attr('content');
    if (availabilityMeta) {
      if (availabilityMeta.toLowerCase().includes('instock')) {
        isInStock = true;
        isOutOfStock = false;
      } else if (availabilityMeta.toLowerCase().includes('outofstock')) {
        isOutOfStock = true;
        isInStock = false;
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

// FirstCry API approach (they have internal APIs)
export async function checkFirstCryAPI(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('firstcry', product.id, product.name);
  
  if (!product.urls.firstcry) {
    result.error = 'No FirstCry URL configured';
    return result;
  }

  // Extract product ID from URL
  const urlMatch = product.urls.firstcry.match(/\/(\d+)\/product-detail/);
  const productId = urlMatch ? urlMatch[1] : null;

  if (!productId) {
    result.error = 'Could not extract product ID from URL';
    return result;
  }

  try {
    // FirstCry's product API
    const apiUrl = `https://www.firstcry.com/api/product/${productId}`;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': product.urls.firstcry,
    };

    const response = await fetchWithRetry(apiUrl, { headers });
    
    if (response.ok) {
      const data = await response.json() as { product?: any };
      if (data && data.product) {
        const p = data.product;
        result.productName = p.name || product.name;
        result.price = p.price || p.sellingPrice;
        result.currency = 'INR';
        result.available = p.isInStock === true || p.stockStatus === 'In Stock';
        result.stockLevel = p.isInStock ? 'in_stock' : 'out_of_stock';
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'API check failed';
  }

  return result;
}