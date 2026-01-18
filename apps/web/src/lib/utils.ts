import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Get status display name in Chinese
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEEDS_CLARIFICATION: '待澄清',
    CONFIRMED: '已确认',
    IN_PROGRESS: '进行中',
    DONE: '已完成',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEEDS_CLARIFICATION: 'border-yellow-500 bg-yellow-50',
    CONFIRMED: 'border-blue-500 bg-blue-50',
    IN_PROGRESS: 'border-purple-500 bg-purple-50',
    DONE: 'border-green-500 bg-green-50',
  };
  return colors[status] || 'border-gray-500 bg-gray-50';
}
