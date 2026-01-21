'use client';

import { useEffect } from 'react';

export function UserSync() {
  useEffect(() => {
    // Sync user with database after component mounts
    const syncUser = async () => {
      try {
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch {
        // Silent fail - user sync is non-critical
      }
    };

    syncUser();
  }, []);

  return null;
}
