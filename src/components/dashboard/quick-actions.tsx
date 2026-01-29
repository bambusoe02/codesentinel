'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Settings,
  Github,
  Home,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function QuickActions() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate and refetch all queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['repositories'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
        queryClient.invalidateQueries({ queryKey: ['metrics'] }),
      ]);
      
      // Refetch all queries
      await queryClient.refetchQueries();
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh data', error);
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const actions = [
    {
      title: 'Settings',
      description: 'Configure GitHub integration and tokens',
      icon: Settings,
      href: '/dashboard/settings',
      variant: 'default' as const,
      type: 'link' as const,
    },
    {
      title: 'Repositories',
      description: 'View and manage your GitHub repositories',
      icon: Github,
      href: '/dashboard#repositories',
      variant: 'secondary' as const,
      type: 'link' as const,
    },
    {
      title: 'Refresh Data',
      description: 'Reload repositories and metrics',
      icon: RefreshCw,
      variant: 'outline' as const,
      type: 'button' as const,
      onClick: handleRefresh,
    },
    {
      title: 'Dashboard',
      description: 'Return to main dashboard',
      icon: Home,
      href: '/dashboard',
      variant: 'outline' as const,
      type: 'link' as const,
    },
  ];

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const isRefreshingAction = action.type === 'button' && isRefreshing;
            
            if (action.type === 'button') {
              return (
                <Button
                  key={action.title}
                  variant={action.variant}
                  className="w-full h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 text-center"
                  onClick={action.onClick}
                  disabled={isRefreshing}
                >
                  {isRefreshingAction ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                  <div>
                    <div className="font-medium text-xs sm:text-sm">
                      {isRefreshingAction ? 'Refreshing...' : action.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            }
            
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant={action.variant}
                  className="w-full h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 text-center"
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <div>
                    <div className="font-medium text-xs sm:text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
