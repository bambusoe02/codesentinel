'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Github,
  Star,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  htmlUrl: string;
  owner: {
    login: string;
    avatar_url?: string;
  };
  topics?: string[];
}

async function fetchRepositories(): Promise<Repository[]> {
  const response = await fetch('/api/repositories');
  if (!response.ok) {
    throw new Error('Failed to fetch repositories');
  }
  const data = await response.json();
  return data.repositories || [];
}

export function RepositoryList() {
  const { data: repositories = [], isLoading, error, refetch } = useQuery({
    queryKey: ['repositories'],
    queryFn: fetchRepositories,
  });
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading repositories</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Failed to load repositories'}
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-lg sm:text-xl">Your Repositories</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="hidden sm:flex">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="sm:hidden">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-0"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  {repo.owner?.avatar_url && (
                    <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
                  )}
                  <AvatarFallback>
                    <Github className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium truncate text-sm sm:text-base">{repo.name}</h3>
                    {repo.language && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      {repo.stargazersCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:flex-col sm:space-y-2 sm:space-x-0">
                <Link href={`/scan/${encodeURIComponent(repo.fullName)}`} className="flex-1 sm:flex-none">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    Analyze
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="ghost"
                  asChild
                  className="sm:w-auto"
                >
                  <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                    <ExternalLink className="w-4 h-4 sm:w-3 sm:h-3" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
        {repositories.length === 0 && (
          <div className="text-center py-8">
            <Github className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No repositories found</h3>
            <p className="text-muted-foreground mb-4">
              Connect your GitHub account or ensure you have repositories to analyze.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
