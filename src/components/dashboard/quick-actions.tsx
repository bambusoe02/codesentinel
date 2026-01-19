'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Github,
  Plus,
  FileText,
  Search,
} from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Connect GitHub',
      description: 'Link your GitHub account to analyze repositories',
      icon: Github,
      href: '/dashboard/connect',
      variant: 'default' as const,
    },
    {
      title: 'New Analysis',
      description: 'Start a fresh code analysis',
      icon: Plus,
      href: '/dashboard/scan',
      variant: 'secondary' as const,
    },
    {
      title: 'View Reports',
      description: 'Browse previous analysis reports',
      icon: FileText,
      href: '/dashboard/reports',
      variant: 'outline' as const,
    },
    {
      title: 'Search Repos',
      description: 'Find and analyze specific repositories',
      icon: Search,
      href: '/dashboard/search',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Button
                  variant={action.variant}
                  className="w-full h-auto p-4 flex flex-col items-center space-y-2 text-center"
                >
                  <Icon className="w-6 h-6" />
                  <div>
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
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
