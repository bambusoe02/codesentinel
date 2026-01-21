'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Github,
  Code,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Repository {
  stargazersCount: number;
  latestAnalysis?: {
    overallScore: number;
    issues: Array<unknown> | null;
  } | null;
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
    
    // Calculate analysis metrics
    const analyzedRepos = repositories.filter((repo: Repository) => repo.latestAnalysis);
    const totalAnalyses = analyzedRepos.length;
    const avgScore = analyzedRepos.length > 0
      ? Math.round(
          analyzedRepos.reduce((sum: number, repo: Repository) => 
            sum + (repo.latestAnalysis?.overallScore || 0), 0
          ) / analyzedRepos.length
        )
      : 0;
    const totalIssues = analyzedRepos.reduce((sum: number, repo: Repository) => {
      const issues = repo.latestAnalysis?.issues;
      return sum + (Array.isArray(issues) ? issues.length : 0);
    }, 0);
    
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
        title: 'Analyses Completed',
        value: totalAnalyses.toString(),
        change: `${totalRepos > 0 ? Math.round((totalAnalyses / totalRepos) * 100) : 0}%`,
        changeType: 'neutral' as const,
        icon: CheckCircle2,
        description: `${totalRepos - totalAnalyses} remaining`,
      },
      {
        title: 'Average Score',
        value: avgScore > 0 ? `${avgScore}/100` : 'N/A',
        change: totalIssues > 0 ? `${totalIssues} issues` : '',
        changeType: avgScore >= 80 ? 'positive' as const : avgScore >= 60 ? 'neutral' as const : 'negative' as const,
        icon: BarChart3,
        description: avgScore > 0 ? 'Health score' : 'No analyses yet',
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
