'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Github,
  Code,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Repository {
  stargazersCount: number;
}

async function fetchRepositories(): Promise<Repository[]> {
  const response = await fetch('/api/repositories');
  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }
  const data = await response.json();
  return data.repositories || [];
}

export function MetricsGrid() {
  const { data: repositories = [], isLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: fetchRepositories,
  });

  const metrics = useMemo(() => {
    const totalRepos = repositories.length;
    const totalStars = repositories.reduce((sum: number, repo: Repository) => sum + (repo.stargazersCount || 0), 0);
    
    return [
      {
        title: 'Total Repositories',
        value: totalRepos.toString(),
        change: '',
        changeType: 'neutral' as const,
        icon: Github,
        description: 'Connected repositories',
      },
      {
        title: 'Total Stars',
        value: totalStars.toLocaleString(),
        change: '',
        changeType: 'neutral' as const,
        icon: Code,
        description: 'Across all repositories',
      },
      {
        title: 'Repositories',
        value: totalRepos.toString(),
        change: '',
        changeType: 'neutral' as const,
        icon: FileText,
        description: 'Available for analysis',
      },
      {
        title: 'Ready to Analyze',
        value: totalRepos.toString(),
        change: '',
        changeType: 'neutral' as const,
        icon: AlertTriangle,
        description: 'Click analyze to start',
      },
    ];
  }, [repositories]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                {metric.change && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    {metric.change}
                  </Badge>
                )}
                <span className="truncate">{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
