'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Settings, Plus, Sun, Moon, Monitor, Bell, Truck, Zap, Baby, Package as PackageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductTracker } from '@/hooks/use-product-tracker';
import { ProductGrid } from '@/components/product-grid';
import { AddProduct } from '@/components/add-product';
import { ProductDetails } from '@/components/product-details';
import { DashboardStats } from '@/components/dashboard-stats';
import { FindCars } from '@/components/find-cars';
import { SettingsPanel } from '@/components/settings-panel';
import { StatusBadge } from '@/components/status-badge';
import { PLATFORMS, Platform } from '@/types/product';

export default function HomePage() {
  const {
    products,
    isLoading,
    stats,
    globalInterval,
    checkProduct,
    startTracking,
    stopTracking,
    startAllTracking,
    stopAllTracking,
    addProduct,
    updateProduct,
    removeProduct,
    checkAllNow,
    updateGlobalInterval,
    enableNotifications,
  } = useProductTracker();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFindCars, setShowFindCars] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  // Theme handling
  useEffect(() => {
    const stored = localStorage.getItem('hotwheels-theme') as 'light' | 'dark' | 'system' | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    }
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
    localStorage.setItem('hotwheels-theme', newTheme);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleCheck = (product: typeof products[0]) => {
    setCheckingIds(prev => new Set(prev).add(product.id));
    checkProduct(product).finally(() => {
      setCheckingIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    });
  };

  const handleAddProduct = (productData: Parameters<typeof addProduct>[0]) => {
    const newProduct = addProduct(productData);
    startTracking(newProduct);
    setShowAddModal(false);
  };

  const handleUpdateProduct = (id: string, updates: Partial<typeof products[0]>) => {
    updateProduct(id, updates);
    const product = products.find(p => p.id === id);
    if (product) {
      const updated = { ...product, ...updates };
      stopTracking(id);
      startTracking(updated);
      if (selectedProduct?.id === id) {
        setSelectedProduct(updated);
      }
    }
  };

  const handleRemoveProduct = (id: string) => {
    removeProduct(id);
    stopTracking(id);
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await enableNotifications();
      if (!granted) return;
    }
    // Update all products
    products.forEach(p => {
      updateProduct(p.id, { notificationsEnabled: enabled });
    });
  };

  const handleSoundToggle = (enabled: boolean) => {
    products.forEach(p => {
      updateProduct(p.id, { soundEnabled: enabled });
    });
  };

  const handleClearAll = () => {
    products.forEach(p => stopTracking(p.id));
    // Clear localStorage is handled in the component
    window.location.reload();
  };

  // Auto-start tracking on load
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      startAllTracking();
    }
    return () => stopAllTracking();
  }, [isLoading, products.length, startAllTracking, stopAllTracking]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Hot Wheels Tracker</h1>
                <p className="text-xs text-muted-foreground">Track your favorite cars across platforms</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {(['light', 'dark', 'system'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={cn(
                      'p-2 rounded-md transition-all',
                      theme === t ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    )}
                    aria-label={t}
                    title={t.charAt(0).toUpperCase() + t.slice(1)}
                  >
                    {t === 'light' && <Sun className="w-4 h-4" />}
                    {t === 'dark' && <Moon className="w-4 h-4" />}
                    {t === 'system' && <Monitor className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              {/* Find Cars */}
              <button
                onClick={() => setShowFindCars(true)}
                className="btn-outline flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Find Cars
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(true)}
                className="btn-outline"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Add Car */}
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Car
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Track the cars you actually want
            </h2>
            <p className="text-lg text-muted-foreground">
              Know when they're back in stock across Blinkit, Zepto, FirstCry & Amazon India
            </p>
          </div>
        </section>

        {/* Stats */}
        <DashboardStats stats={stats} isTracking={products.length > 0} />

        {/* Platform Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Platforms:</span>
          {PLATFORMS.map(p => (
            <span key={p.id} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full', p.color + '/20 text-' + p.color.replace('bg-', '').replace('-500', '-700'))}>
              <span aria-hidden="true">{p.icon}</span>
              {p.name}
            </span>
          ))}
        </div>

        {/* Tracking Status Banner */}
        {products.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Tracking {products.length} car{products.length !== 1 ? 's' : ''}</p>
                <p className="text-sm text-muted-foreground">
                  Checks every {globalInterval / 60000} minute{globalInterval !== 60000 ? 's' : ''} • 
                  {stats.inStock} in stock • {stats.outOfStock} out of stock
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={checkAllNow}
                disabled={checkingIds.size > 0}
                className="btn-outline text-sm"
              >
                {checkingIds.size > 0 ? 'Checking...' : 'Check All Now'}
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <ProductGrid
          products={products}
          onCheck={handleCheck}
          onRemove={handleRemoveProduct}
          onViewDetails={setSelectedProduct}
          checkingIds={checkingIds}
          filter="all"
          onFilterChange={() => {}}
        />

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No cars tracked yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your first Hot Wheels car to start tracking. You can search for cars or add them directly using a product URL.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Car Manually
              </button>
              <button
                onClick={() => setShowFindCars(true)}
                className="btn-outline flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Find Cars
              </button>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> This tracker runs in your browser only. 
            Tracking stops when you close this tab. 
            Automatic checking is limited by marketplace anti-bot protection.
          </p>
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddProduct
          onAdd={handleAddProduct}
          onClose={() => setShowAddModal(false)}
          defaultInterval={globalInterval}
        />
      )}

      {showFindCars && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-card rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Find Hot Wheels Cars</h2>
              <button
                onClick={() => setShowFindCars(false)}
                className="btn-ghost p-1.5 rounded-lg hover:bg-accent"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FindCars onAddProduct={handleAddProduct} />
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] bg-card rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="btn-ghost p-1.5 rounded-lg hover:bg-accent"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SettingsPanel />
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onCheck={handleCheck}
          onRemove={handleRemoveProduct}
          onUpdate={handleUpdateProduct}
          isChecking={checkingIds.has(selectedProduct.id)}
        />
      )}
    </div>
  );
}