'use client';

import { useState, useRef, useEffect } from 'react';
import { PLATFORMS, Platform } from '@/types/product';
import { cn } from '@/lib/utils';
import { Search, ExternalLink, X, Loader2, Truck, Zap, Baby, Package } from 'lucide-react';

interface FindCarsProps {
  onAddProduct: (product: {
    name: string;
    image?: string;
    url: string;
    platform: Platform;
    checkInterval: number;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
  }) => void;
}

const POPULAR_SEARCHES = [
  'Porsche 911 GT3 RS',
  'Nissan Skyline GT-R',
  'BMW M3',
  'Toyota Supra',
  'Honda NSX',
  'Ford Mustang',
  'Chevrolet Camaro',
  'Dodge Challenger',
  'Mazda RX-7',
  'Subaru WRX STI',
  'Lamborghini Countach',
  'Ferrari F40',
];

export function FindCars({ onAddProduct }: FindCarsProps) {
  const [query, setQuery] = useState('');
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ platform: Platform; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    
    // Generate search URLs for each platform
    const searchResults = PLATFORMS
      .filter(p => activePlatform === 'all' || p.id === activePlatform)
      .map(p => ({
        platform: p.id,
        url: p.searchUrl(query.trim()),
      }));

    setResults(searchResults);
    
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleOpenSearch = (url: string) => {
    window.open(url, '_blank');
  };

  const handlePopularSearch = (search: string) => {
    setQuery(search);
    handleSearch(new Event('submit') as unknown as React.FormEvent);
  };

  const platformIcons: Record<Platform, React.ReactNode> = {
    blinkit: <Truck className="w-5 h-5" />,
    zepto: <Zap className="w-5 h-5" />,
    firstcry: <Baby className="w-5 h-5" />,
    amazon: <Package className="w-5 h-5" />,
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Find Hot Wheels Cars</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Search for a car name across all platforms. Click a platform to open its search results.
        </p>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g., Porsche 911 GT3 RS, Nissan Skyline GT-R..."
                className="input-field pl-10"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="btn-primary px-6"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>

        {/* Platform Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActivePlatform('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activePlatform === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            All Platforms
          </button>
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                activePlatform === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {platformIcons[p.id]}
              {p.name}
            </button>
          ))}
        </div>

        {/* Popular Searches */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map(search => (
              <button
                key={search}
                onClick={() => handlePopularSearch(search)}
                className="btn-outline text-xs py-1 px-2"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Search Results for "{query}"</h3>
            <span className="text-sm text-muted-foreground">{results.length} platforms</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {results.map(result => {
              const platformInfo = PLATFORMS.find(p => p.id === result.platform);
              return (
                <button
                  key={result.platform}
                  onClick={() => handleOpenSearch(result.url)}
                  className={cn(
                    'group p-4 rounded-lg border transition-all text-left',
                    'hover:border-primary/50 hover:bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('p-3 rounded-xl', platformInfo?.color + '/20')}>
                      {platformIcons[result.platform]}
                    </div>
                    <div>
                      <p className="font-medium">{platformInfo?.name}</p>
                      <p className="text-xs text-muted-foreground">Opens search results</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {result.url}
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            After finding the car you want, copy its product URL and use the "Add Car" button to track it.
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">How to Track a Car</h3>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3 text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">1</span>
            <div>
              <p className="font-medium text-foreground">Search</p>
              <p>Use the search above to find your car on each platform</p>
            </div>
          </li>
          <li className="flex items-start gap-3 text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">2</span>
            <div>
              <p className="font-medium text-foreground">Copy URL</p>
              <p>Open the product page and copy its URL from the address bar</p>
            </div>
          </li>
          <li className="flex items-start gap-3 text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">3</span>
            <div>
              <p className="font-medium text-foreground">Add to Tracker</p>
              <p>Click "Add Car" and paste the URL, then enter details manually</p>
            </div>
          </li>
          <li className="flex items-start gap-3 text-muted-foreground">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">4</span>
            <div>
              <p className="font-medium text-foreground">Get Notified</p>
              <p>Receive browser notifications when the car is back in stock</p>
            </div>
          </li>
        </ol>
        
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground">
            <strong>Important:</strong> Due to anti-bot protection on these marketplaces, 
            automatic stock checking is not possible from the browser. You'll need to manually 
            verify availability by clicking "Open Product" on each tracked car. The tracker 
            will remind you to check at your configured interval.
          </p>
        </div>
      </div>
    </div>
  );
}