import * as fs from 'fs';
import * as path from 'path';

export interface ProductConfig {
  id: string;
  name: string;
  pincode: string;
  urls: {
    blinkit?: string;
    zepto?: string;
    firstcry?: string;
    amazon?: string;
  };
  checkIntervalMinutes: number;
  notifyOnRestock: boolean;
  targetPrice?: number;  // Alert only when price <= this value
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface Config {
  products: ProductConfig[];
  telegram: TelegramConfig;
  defaultPincode: string;
  userAgent: string;
  requestTimeout: number;
  maxRetries: number;
}

const CONFIG_PATH = path.join(__dirname, '..', 'storage', 'config.json');
const DEFAULT_CONFIG: Config = {
  products: [
    {
      id: 'hw-fast-furious-orange',
      name: 'Hot Wheels Premium Fast & Furious Die-Cast Toy Car (Orange)',
      pincode: '110001', // CHANGE THIS TO YOUR PINCODE
      urls: {
        blinkit: '', // ADD BLINKIT PRODUCT URL HERE
        zepto: '',   // ADD ZEPTO PRODUCT URL HERE
        firstcry: 'https://www.firstcry.com/hot-wheels/hot-wheels-premium-fast-and-furious-die-cast-toy-car-for-adult-collectors-orange/21161951/product-detail',
        amazon: '',  // ADD AMAZON PRODUCT URL HERE
      },
      checkIntervalMinutes: 10,
      notifyOnRestock: true,
      targetPrice: 199,  // Alert only when price <= ₹199
    },
  ],
  telegram: {
    botToken: '', // ADD YOUR TELEGRAM BOT TOKEN HERE
    chatId: '',   // ADD YOUR CHAT ID HERE
    enabled: false,
  },
  defaultPincode: '110001',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  requestTimeout: 15000,
  maxRetries: 2,
};

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...fileConfig };
    }
  } catch (error) {
    console.warn('Failed to load config, using defaults:', error);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: Config): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

export const config = loadConfig();