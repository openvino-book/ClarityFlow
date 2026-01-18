import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  status?: 'NEEDS_CLARIFICATION' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE';
  variant?: 'status' | 'default';
}

const statusColors = {
  NEEDS_CLARIFICATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  DONE: 'bg-green-100 text-green-800 border-green-200',
};

export default function Badge({
  children,
  className,
  status,
  variant = 'default',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors duration-200';

  const variantStyles = variant === 'status' && status
    ? statusColors[status]
    : 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
