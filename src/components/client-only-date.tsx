'use client';

import { formatDistanceToNow } from 'date-fns';

interface ClientOnlyDateProps {
  date: Date | string;
  format?: 'relative' | 'absolute';
  className?: string;
}

export function ClientOnlyDate({ date, format = 'relative', className }: ClientOnlyDateProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    return (
      <span className={className} suppressHydrationWarning>
        {formatDistanceToNow(dateObj, { addSuffix: true })}
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {dateObj.toLocaleDateString()}
    </span>
  );
}
