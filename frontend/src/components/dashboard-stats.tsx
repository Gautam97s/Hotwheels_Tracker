'use client';

import { cn } from '@/lib/utils';
import { PackageCheck, PackageX, AlertTriangle, Package, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    total: number;
    inStock: number;
    outOfStock: number;
    failed: number;
    unknown: number;
  };
  isTracking: boolean;
}

export function DashboardStats({ stats, isTracking }: DashboardStatsProps) {
  const statCards = [
    {
      label: 'Tracked Cars',
      value: stats.total,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'In Stock',
      value: stats.inStock,
      icon: PackageCheck,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Out of Stock',
      value: stats.outOfStock,
      icon: PackageX,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Unable to Check',
      value: stats.failed + stats.unknown,
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            'card p-4 transition-all duration-300',
            'hover:shadow-md'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
            <div className={cn('p-3 rounded-xl', stat.bg)}>
              <stat.icon className={cn('w-6 h-6', stat.color)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}