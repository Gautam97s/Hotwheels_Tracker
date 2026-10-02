export type Platform = 'blinkit' | 'zepto' | 'firstcry' | 'amazon';

export type AvailabilityStatus = 
  | 'IN_STOCK'
  | 'OUT_OF_STOCK'
  | 'NOT_FOUND'
  | 'CHECK_FAILED'
  | 'UNKNOWN';

export interface ProductStatus {
  available: boolean | null;
  price?: number;
  name?: string;
  image?: string;
  checkedAt: string;
  error?: string;
  status: AvailabilityStatus;
}

export interface TrackedProduct {
  id: string;
  name: string;
  image?: string;
  url: string;
  platform: Platform;
  status: ProductStatus;
  checkInterval: number; // in milliseconds
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastStatusChange?: string;
  lastSuccessfulCheck?: string;
}

export interface NotificationSettings {
  browserEnabled: boolean;
  soundEnabled: boolean;
}

export interface CheckIntervalOption {
  label: string;
  value: number; // in milliseconds
}

export const CHECK_INTERVALS: CheckIntervalOption[] = [
  { label: 'Every 30 seconds', value: 30 * 1000 },
  { label: 'Every 1 minute', value: 60 * 1000 },
  { label: 'Every 5 minutes', value: 5 * 60 * 1000 },
  { label: 'Every 10 minutes', value: 10 * 60 * 1000 },
];

export const DEFAULT_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface PlatformInfo {
  id: Platform;
  name: string;
  color: string;
  icon: string;
  searchUrl: (query: string) => string;
  productUrlPattern: RegExp;
}

export const PLATFORMS: PlatformInfo[] = [
  {
    id: 'blinkit',
    name: 'Blinkit',
    color: 'bg-amber-500',
    icon: '🛒',
    searchUrl: (query: string) => `https://blinkit.com/search?q=${encodeURIComponent(query)}`,
    productUrlPattern: /blinkit\.com\/product\/|blinkit\.com\/.*\/p\//i,
  },
  {
    id: 'zepto',
    name: 'Zepto',
    color: 'bg-purple-500',
    icon: '⚡',
    searchUrl: (query: string) => `https://www.zepto.com/search?q=${encodeURIComponent(query)}`,
    productUrlPattern: /zepto\.com\/.*\/p\//i,
  },
  {
    id: 'firstcry',
    name: 'FirstCry',
    color: 'bg-pink-500',
    icon: '👶',
    searchUrl: (query: string) => `https://www.firstcry.com/search?q=${encodeURIComponent(query)}`,
    productUrlPattern: /firstcry\.com\/.*\/product\//i,
  },
  {
    id: 'amazon',
    name: 'Amazon India',
    color: 'bg-orange-500',
    icon: '📦',
    searchUrl: (query: string) => `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
    productUrlPattern: /amazon\.in\/.*\/dp\/|amazon\.in\/.*\/gp\/product\//i,
  },
];

export function getPlatformById(id: Platform): PlatformInfo | undefined {
  return PLATFORMS.find(p => p.id === id);
}

export function getPlatformFromUrl(url: string): Platform | null {
  for (const platform of PLATFORMS) {
    if (platform.productUrlPattern.test(url)) {
      return platform.id;
    }
  }
  return null;
}

export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return '—';
  return `₹${price.toLocaleString('en-IN')}`;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getStatusColor(status: AvailabilityStatus): string {
  switch (status) {
    case 'IN_STOCK':
      return 'bg-success text-success-foreground';
    case 'OUT_OF_STOCK':
      return 'bg-destructive text-destructive-foreground';
    case 'NOT_FOUND':
      return 'bg-warning text-warning-foreground';
    case 'CHECK_FAILED':
      return 'bg-muted text-muted-foreground';
    case 'UNKNOWN':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getStatusLabel(status: AvailabilityStatus): string {
  switch (status) {
    case 'IN_STOCK':
      return 'IN STOCK';
    case 'OUT_OF_STOCK':
      return 'OUT OF STOCK';
    case 'NOT_FOUND':
      return 'NOT FOUND';
    case 'CHECK_FAILED':
      return 'UNABLE TO CHECK';
    case 'UNKNOWN':
    default:
      return 'UNKNOWN';
  }
}

export function getStatusIcon(status: AvailabilityStatus): string {
  switch (status) {
    case 'IN_STOCK':
      return '🟢';
    case 'OUT_OF_STOCK':
      return '🔴';
    case 'NOT_FOUND':
      return '🟡';
    case 'CHECK_FAILED':
      return '⚠️';
    case 'UNKNOWN':
    default:
      return '⚪';
  }
}