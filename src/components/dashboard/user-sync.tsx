'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function UserSync() {
  useEffect(() => {
    // Sync user with database after component mounts
    const syncUser = async () => {
      try {
        const response = await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error('User sync failed', {
            status: response.status,
            error: errorData.error || 'Unknown error',
          });
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (data.success) {
          logger.info('User synced successfully', {
            userId: data.user?.id,
            email: data.user?.email,
          });
        }
      } catch (error) {
        // Silent fail - user sync is non-critical
        logger.error('User sync error', error);
      }
    };

    syncUser();
  }, []);

  return null;
}
