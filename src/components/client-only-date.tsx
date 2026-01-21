'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyDateProps {
  date: Date | string;
  format?: 'relative' | 'absolute';
  className?: string;
}

export function ClientOnlyDate({ date, format = 'relative', className }: ClientOnlyDateProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setMounted(true);
    
    if (format === 'relative') {
      const { formatDistanceToNow } = require('date-fns');
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      setFormattedDate(formatDistanceToNow(dateObj, { addSuffix: true }));
    } else {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      setFormattedDate(dateObj.toLocaleDateString());
    }
  }, [date, format]);

  if (!mounted) {
    return <span className={className} suppressHydrationWarning>...</span>;
  }

  return <span className={className} suppressHydrationWarning>{formattedDate}</span>;
}
