'use client';

import { TrackedProduct, Platform, formatPrice, formatRelativeTime, PLATFORMS, CHECK_INTERVALS } from '@/types/product';
import { cn } from '@/lib/utils';
import { X, ExternalLink, RefreshCw, Trash2, Bell, BellOff, Volume2, VolumeX, Calendar, Clock, Tag, Globe, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './status-badge';

interface ProductDetailsProps {
  product: TrackedProduct | null;
  onClose: () => void;
  onCheck: (product: TrackedProduct) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TrackedProduct>) => void;
  isChecking: boolean;
}

export function ProductDetails({ 
  product, 
  onClose, 
  onCheck, 
  onRemove, 
  onUpdate,
  isChecking 
}: ProductDetailsProps) {
  if (!product) return null;

  const platformInfo = PLATFORMS.find(p => p.id === product.platform);
  const handleOpenProduct = () => window.open(product.url, '_blank');
  const handleCheck = () => onCheck(product);
  const handleRemove = () => {
    if (confirm(`Remove "${product.name}" from tracking?`)) {
      onRemove(product.id);
      onClose();
    }
  };

  const handleIntervalChange = (interval: number) => {
    onUpdate(product.id, { checkInterval: interval });
  };

  const handleNotificationToggle = () => {
    onUpdate(product.id, { notificationsEnabled: !product.notificationsEnabled });
  };

  const handleSoundToggle = () => {
    onUpdate(product.id, { soundEnabled: !product.soundEnabled });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <div className="w-full max-w-2xl bg-card rounded-xl shadow-xl max-h-[90vh] overflow-hidden animate-in slide-in-from-top-4 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {platformInfo && (
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', platformInfo.color + '/20 text-' + platformInfo.color.replace('bg-', '').replace('-500', '-700'))}>
                  <span aria-hidden="true">{platformInfo.icon}</span>
                  {platformInfo.name}
                </span>
              )}
              <StatusBadge status={product.status.status} size="sm" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 rounded-lg hover:bg-accent"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Large Image */}
          <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-6 relative">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Price */}
          {product.status.price !== undefined && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
              <Tag className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold">{formatPrice(product.status.price)}</p>
              </div>
            </div>
          )}

          {/* Status Section */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-background">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Checked</p>
                <p className="font-medium">{formatRelativeTime(product.status.checkedAt)}</p>
              </div>
            </div>

            {product.lastSuccessfulCheck && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-background">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Successful Check</p>
                  <p className="font-medium">{formatRelativeTime(product.lastSuccessfulCheck)}</p>
                </div>
              </div>
            )}

            {product.lastStatusChange && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-background">
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Status Change</p>
                  <p className="font-medium">{formatRelativeTime(product.lastStatusChange)}</p>
                </div>
              </div>
            )}

            {product.createdAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-background">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Added to Tracker</p>
                  <p className="font-medium">{formatRelativeTime(product.createdAt)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Product URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Product URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={product.url}
                readOnly
                className="input-field flex-1 bg-muted"
              />
              <button
                onClick={handleOpenProduct}
                className="btn-outline"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error message for failed checks */}
          {product.status.status === 'CHECK_FAILED' && product.status.error && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Unable to Check Automatically</p>
                  <p className="text-sm text-muted-foreground mt-1">{product.status.error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This marketplace blocks browser-based requests. Click "Open Product" to check manually.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Settings */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Tracking Settings</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Check Interval</label>
              <div className="flex flex-wrap gap-2">
                {CHECK_INTERVALS.map(interval => (
                  <button
                    key={interval.value}
                    onClick={() => handleIntervalChange(interval.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      product.checkInterval === interval.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className={cn(
                'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                product.notificationsEnabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn('p-2 rounded-lg', product.notificationsEnabled ? 'bg-primary/10' : 'bg-muted')}>
                    {product.notificationsEnabled ? (
                      <Bell className="w-4 h-4 text-primary" />
                    ) : (
                      <BellOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Browser Notifications</p>
                    <p className="text-xs text-muted-foreground">Alert when restocked</p>
                  </div>
                </div>
                <button
                  onClick={handleNotificationToggle}
                  className={cn(
                    'relative w-10 h-6 rounded-full transition-colors',
                    product.notificationsEnabled ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    product.notificationsEnabled ? 'left-4.5' : 'left-0.5'
                  )} />
                </button>
              </label>

              <label className={cn(
                'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                product.soundEnabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/50',
                !product.notificationsEnabled && 'opacity-50 cursor-not-allowed'
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn('p-2 rounded-lg', product.soundEnabled ? 'bg-primary/10' : 'bg-muted')}>
                    {product.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-primary" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Sound Alerts</p>
                    <p className="text-xs text-muted-foreground">Play notification sound</p>
                  </div>
                </div>
                <button
                  onClick={handleSoundToggle}
                  disabled={!product.notificationsEnabled}
                  className={cn(
                    'relative w-10 h-6 rounded-full transition-colors',
                    product.soundEnabled ? 'bg-primary' : 'bg-muted',
                    !product.notificationsEnabled && 'opacity-50'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    product.soundEnabled ? 'left-4.5' : 'left-0.5'
                  )} />
                </button>
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-6 mt-6">
            <h3 className="font-medium mb-4 text-destructive">Danger Zone</h3>
            <button
              onClick={handleRemove}
              className="btn-outline text-destructive border-destructive/50 hover:bg-destructive/10 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove from Tracker
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isChecking && 'animate-spin')} />
            {isChecking ? 'Checking...' : 'Check Now'}
          </button>
          <button
            onClick={handleOpenProduct}
            className="btn-outline flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Product
          </button>
        </div>
      </div>
    </div>
  );
}