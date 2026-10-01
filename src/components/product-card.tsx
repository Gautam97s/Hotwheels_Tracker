'use client';

import { TrackedProduct, Platform, formatPrice, formatRelativeTime, PLATFORMS } from '@/types/product';
import { StatusBadge } from './status-badge';
import { cn } from '@/lib/utils';
import { ExternalLink, RefreshCw, Trash2, MoreHorizontal, Eye } from 'lucide-react';

interface ProductCardProps {
  product: TrackedProduct;
  onCheck: (product: TrackedProduct) => void;
  onRemove: (id: string) => void;
  onViewDetails: (product: TrackedProduct) => void;
  isChecking?: boolean;
}

export function ProductCard({ product, onCheck, onRemove, onViewDetails, isChecking }: ProductCardProps) {
  const platformInfo = PLATFORMS.find(p => p.id === product.platform);
  
  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheck(product);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove "${product.name}" from tracking?`)) {
      onRemove(product.id);
    }
  };

  const handleOpenProduct = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(product.url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'text-success';
      case 'OUT_OF_STOCK':
        return 'text-destructive';
      case 'NOT_FOUND':
        return 'text-warning';
      case 'CHECK_FAILED':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div 
      className={cn(
        'product-card group relative p-4',
        product.status.status === 'IN_STOCK' && 'ring-2 ring-success/30',
        product.status.status === 'OUT_OF_STOCK' && 'opacity-70'
      )}
      onClick={() => onViewDetails(product)}
    >
      {/* Product Image */}
      <div className="aspect-square rounded-lg bg-muted overflow-hidden mb-3 relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Checking indicator */}
        {isChecking && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Product Name */}
      <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {product.name}
      </h3>

      {/* Platform & Status */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', platformInfo?.color + '/20 text-' + platformInfo?.color.replace('bg-', '').replace('-500', '-700'))}>
          <span aria-hidden="true">{platformInfo?.icon}</span>
          {platformInfo?.name}
        </span>
        <StatusBadge status={product.status.status} size="sm" />
      </div>

      {/* Price */}
      {product.status.price !== undefined && (
        <div className="text-lg font-semibold text-foreground mb-2">
          {formatPrice(product.status.price)}
        </div>
      )}

      {/* Last checked */}
      <div className="text-xs text-muted-foreground mb-3">
        Last checked: {formatRelativeTime(product.status.checkedAt)}
      </div>

      {/* Error message for failed checks */}
      {product.status.status === 'CHECK_FAILED' && product.status.error && (
        <div className="text-xs text-destructive mb-3 p-2 bg-destructive/10 rounded-lg">
          {product.status.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenProduct}
          className="btn-outline flex-1 justify-center gap-1 text-xs py-1.5"
          title="Open product page"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Product
        </button>
        <button
          onClick={handleCheckClick}
          disabled={isChecking}
          className="btn-primary flex-1 justify-center gap-1 text-xs py-1.5"
          title="Check now"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isChecking && 'animate-spin')} />
          {isChecking ? 'Checking...' : 'Check Now'}
        </button>
      </div>
    </div>
  );
}