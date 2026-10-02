'use client';

import { TrackedProduct, AvailabilityStatus, PLATFORMS } from '@/types/product';
import { ProductCard } from './product-card';
import { cn } from '@/lib/utils';
import { Filter, X } from 'lucide-react';

type FilterType = 'all' | 'in-stock' | 'out-of-stock' | 'failed';

interface ProductGridProps {
  products: TrackedProduct[];
  onCheck: (product: TrackedProduct) => void;
  onRemove: (id: string) => void;
  onViewDetails: (product: TrackedProduct) => void;
  checkingIds: Set<string>;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function ProductGrid({ 
  products, 
  onCheck, 
  onRemove, 
  onViewDetails, 
  checkingIds,
  filter,
  onFilterChange 
}: ProductGridProps) {
  const filteredProducts = products.filter(product => {
    switch (filter) {
      case 'in-stock':
        return product.status.status === 'IN_STOCK';
      case 'out-of-stock':
        return product.status.status === 'OUT_OF_STOCK';
      case 'failed':
        return product.status.status === 'CHECK_FAILED' || product.status.status === 'NOT_FOUND';
      default:
        return true;
    }
  });

  const filterOptions: { value: FilterType; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: products.length },
    { value: 'in-stock', label: 'In Stock', count: products.filter(p => p.status.status === 'IN_STOCK').length },
    { value: 'out-of-stock', label: 'Out of Stock', count: products.filter(p => p.status.status === 'OUT_OF_STOCK').length },
    { value: 'failed', label: 'Failed', count: products.filter(p => p.status.status === 'CHECK_FAILED' || p.status.status === 'NOT_FOUND').length },
  ];

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No tracked cars yet</h3>
        <p className="text-muted-foreground">Add your first Hot Wheels car to start tracking</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Filter className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No cars match this filter</h3>
        <p className="text-muted-foreground">Try a different filter or add more cars</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-muted rounded-lg" role="tablist">
        {filterOptions.map(({ value, label, count }) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => onFilterChange(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              filter === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            <span className={cn('px-1.5 py-0.5 text-xs rounded-full', filter === value ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onCheck={onCheck}
            onRemove={onRemove}
            onViewDetails={onViewDetails}
            isChecking={checkingIds.has(product.id)}
          />
        ))}
      </div>

      {filteredProducts.length < products.length && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Showing {filteredProducts.length} of {products.length} tracked cars
        </p>
      )}
    </div>
  );
}