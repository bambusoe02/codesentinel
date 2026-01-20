'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Settings,
  Github,
  Home,
  RefreshCw,
} from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Settings',
      description: 'Configure GitHub integration and tokens',
      icon: Settings,
      href: '/dashboard/settings',
      variant: 'default' as const,
    },
    {
      title: 'Repositories',
      description: 'View and manage your GitHub repositories',
      icon: Github,
      href: '/dashboard#repositories',
      variant: 'secondary' as const,
    },
    {
      title: 'Refresh Data',
      description: 'Reload repositories and metrics',
      icon: RefreshCw,
      href: '/dashboard',
      variant: 'outline' as const,
    },
    {
      title: 'Dashboard',
      description: 'Return to main dashboard',
      icon: Home,
      href: '/dashboard',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
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
