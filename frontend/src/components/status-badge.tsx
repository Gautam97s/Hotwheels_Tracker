'use client';

import { AvailabilityStatus, getStatusColor, getStatusLabel, getStatusIcon } from '@/types/product';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AvailabilityStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1 font-medium';
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  const colorStyles = getStatusColor(status);

  return (
    <span className={cn(baseStyles, sizeStyles[size], colorStyles, 'rounded-full')}>
      {showIcon && <span aria-hidden="true">{getStatusIcon(status)}</span>}
      <span>{getStatusLabel(status)}</span>
    </span>
  );
}