import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CONFIG_KEY = 'hotwheels:tracker:config';

export interface TrackerConfig {
  products: Array<{
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
    targetPrice?: number;
  }>;
  telegram: {
    botToken: string;
    chatId: string;
    enabled: boolean;
  };
  defaultPincode: string;
  userAgent: string;
  requestTimeout: number;
  maxRetries: number;
  updatedAt: string;
}

const DEFAULT_CONFIG: TrackerConfig = {
  products: [
    {
      id: 'hw-fast-furious-orange',
      name: 'Hot Wheels Premium Fast & Furious Die-Cast Toy Car (Orange)',
      pincode: '110001',
      urls: {
        firstcry: 'https://www.firstcry.com/hot-wheels/hot-wheels-premium-fast-and-furious-die-cast-toy-car-for-adult-collectors-orange/21161951/product-detail',
      },
      checkIntervalMinutes: 10,
      notifyOnRestock: true,
      targetPrice: 199,
    },
  ],
  telegram: {
    botToken: '',
    chatId: '',
    enabled: false,
  },
  defaultPincode: '110001',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  requestTimeout: 15000,
  maxRetries: 2,
  updatedAt: new Date().toISOString(),
};

async function getConfig(): Promise<TrackerConfig> {
  try {
    const stored = await kv.get<TrackerConfig>(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...stored, products: stored.products || DEFAULT_CONFIG.products };
    }
  } catch (error) {
    console.warn('Failed to fetch config from KV, using defaults:', error);
  }
  return DEFAULT_CONFIG;
}

async function saveConfig(config: TrackerConfig): Promise<void> {
  try {
    const configWithTimestamp = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(CONFIG_KEY, configWithTimestamp);
  } catch (error) {
    console.error('Failed to save config to KV:', error);
    throw new Error('Failed to save configuration');
  }
}

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = await getConfig();
    
    // Merge with existing config
    const updatedConfig: TrackerConfig = {
      ...config,
      ...body,
      products: body.products || config.products,
      telegram: { ...config.telegram, ...body.telegram },
    };
    
    await saveConfig(updatedConfig);
    
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}