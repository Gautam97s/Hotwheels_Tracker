import { StockResult, createBaseResult, fetchWithRetry } from './base';
import { ProductConfig } from '../config';
import * as cheerio from 'cheerio';

export async function checkAmazon(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('amazon', product.id, product.name);
  
  if (!product.urls.amazon) {
    result.error = 'No Amazon URL configured';
    return result;
  }

  try {
    const url = product.urls.amazon;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    };

    const response = await fetchWithRetry(url, { headers });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Check for CAPTCHA/block
    if (html.includes('captcha') || html.includes('CAPTCHA') || 
        html.includes('Robot Check') || html.includes('Enter the characters')) {
      result.error = 'Blocked by Amazon CAPTCHA/anti-bot';
      result.available = false;
      result.stockLevel = 'unknown';
      return result;
    }

    // Amazon stock indicators
    const outOfStockSelectors = [
      '#availability .a-color-state:contains("Out of Stock")',
      '#availability .a-color-price:contains("Out of Stock")',
      '#availability:contains("Currently unavailable")',
      '#availability:contains("Out of Stock")',
      '.a-button-preorder:contains("Pre-order")',
      '#add-to-cart-button:disabled',
      '#buy-now-button:disabled',
      '.a-button-disabled#add-to-cart-button',
      '#dynamicDeliveryMessage:contains("Out of Stock")',
      '.availability.out-of-stock',
    ];

    let isOutOfStock = false;
    for (const selector of outOfStockSelectors) {
      if ($(selector).length > 0) {
        isOutOfStock = true;
        break;
      }
    }

    const inStockSelectors = [
      '#add-to-cart-button:not(:disabled)',
      '#buy-now-button:not(:disabled)',
      '#availability .a-color-success:contains("In Stock")',
      '#availability:contains("In Stock")',
      '.a-button-primary#add-to-cart-button',
      '.a-button-primary#buy-now-button',
      '[data-csa-c-type="widget"]#add-to-cart-button',
    ];

    let isInStock = false;
    for (const selector of inStockSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          if (!$(el).is(':disabled') && !$(el).hasClass('a-button-disabled')) {
            isInStock = true;
            break;
          }
        }
      }
      if (isInStock) break;
    }

    // Check availability span
    const availabilityText = $('#availability').text().toLowerCase();
    if (availabilityText.includes('in stock')) {
      isInStock = true;
      isOutOfStock = false;
    } else if (availabilityText.includes('out of stock') || availabilityText.includes('unavailable')) {
      isOutOfStock = true;
      isInStock = false;
    }

    // Extract price
    const priceSelectors = [
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '.a-price .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
      '#price .a-offscreen',
      '.a-price-whole',
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
      '#productTitle',
      'h1#title',
      '#titleSection #title',
    ];

    let productName = product.name;
    for (const selector of nameSelectors) {
      const element = $(selector).first();
      if (element.length > 0 && element.text().trim()) {
        productName = element.text().trim();
        break;
      }
    }

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
            isInStock = true;
            isOutOfStock = false;
          } else if (availability.includes('outofstock')) {
            isOutOfStock = true;
            isInStock = false;
          }
        }
        if (data.offers && data.offers.price) {
          price = parseFloat(data.offers.price);
        }
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
      if (result.error?.includes('CAPTCHA')) {
        // Already set
      } else {
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

// Amazon PA-API approach (requires AWS credentials)
export async function checkAmazonAPI(product: ProductConfig): Promise<StockResult> {
  const result = createBaseResult('amazon', product.id, product.name);
  
  if (!product.urls.amazon) {
    result.error = 'No Amazon URL configured';
    return result;
  }

  // Extract ASIN from URL
  const asinMatch = product.urls.amazon.match(/\/dp\/([A-Z0-9]{10})/);
  const asin = asinMatch ? asinMatch[1] : null;

  if (!asin) {
    result.error = 'Could not extract ASIN from URL';
    return result;
  }

  // Note: Amazon Product Advertising API requires AWS credentials and registration
  // This is a placeholder for when you have PA-API access
  result.error = 'PA-API not configured. Use HTML scraping instead.';
  
  return result;
}