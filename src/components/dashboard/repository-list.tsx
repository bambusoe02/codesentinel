'use client';

import { useState } from 'react';
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
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { ClientOnlyDate } from '@/components/client-only-date';

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
  latestAnalysis?: {
    id: string;
    overallScore: number;
    createdAt: string;
    issues: Array<{ severity: string }> | null;
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

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'destructive';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function RepositoryList() {
  const queryClient = useQueryClient();
  const [analyzingRepo, setAnalyzingRepo] = useState<string | null>(null);

  const { data: repositories = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['repositories'],
    queryFn: fetchRepositories,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (repoFullName: string) => {
      const response = await fetch(`/api/repositories/${encodeURIComponent(repoFullName)}/analyze`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || 'Failed to start analysis';
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onMutate: async (repoFullName) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['repositories'] });
      // Optimistically update UI
      setAnalyzingRepo(repoFullName);
    },
    onSuccess: (data, repoFullName) => {
      // Show success message
      toast.success('Analysis completed successfully!');
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-results', repoFullName] });
      queryClient.invalidateQueries({ queryKey: ['analysis-history', repoFullName] });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      
      setAnalyzingRepo(null);
      
      // Force refetch after a short delay to ensure fresh data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['repositories'] });
        queryClient.refetchQueries({ queryKey: ['analysis-results', repoFullName] });
      }, 500);
      
      // Automatically redirect to results page after analysis completes
      setTimeout(() => {
        window.location.href = `/scan/${encodeURIComponent(repoFullName)}`;
      }, 1500);
    },
    onError: (error, repoFullName) => {
      logger.error('Analysis error', error, { repoFullName });
      // Revert optimistic update
      setAnalyzingRepo(null);
      // Show error toast
      toast.error(
        error instanceof Error ? error.message : 'Failed to start analysis',
        {
          description: `Could not analyze ${repoFullName}. Please try again.`,
        }
      );
    },
  });

  const handleAnalyze = (repoFullName: string) => {
    if (!repoFullName) {
      return;
    }
    logger.info('Starting analysis', { repoFullName });
    // Optimistically update UI immediately
    setAnalyzingRepo(repoFullName);
    analyzeMutation.mutate(repoFullName);
  };
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
            <Button onClick={() => refetch()} disabled={isRefetching}>
              {isRefetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="hidden sm:flex"
            disabled={isRefetching}
          >
            {isRefetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="sm:hidden"
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
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
                    {repo.latestAnalysis && (
                      <span className="flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                        Analyzed <ClientOnlyDate date={repo.latestAnalysis.createdAt} format="relative" className="ml-1" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:flex-col sm:space-y-2 sm:space-x-0">
                {repo.latestAnalysis && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge 
                      variant={getScoreBadgeVariant(repo.latestAnalysis.overallScore)}
                      className={`text-xs ${getScoreColor(repo.latestAnalysis.overallScore)}`}
                    >
                      Score: {repo.latestAnalysis.overallScore}/100
                    </Badge>
                    {repo.latestAnalysis.issues && repo.latestAnalysis.issues.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {repo.latestAnalysis.issues.length} issue{repo.latestAnalysis.issues.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                  {analyzingRepo === repo.fullName ? (
                    <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </Button>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant={repo.latestAnalysis ? "secondary" : "default"}
                        className="flex-1 sm:flex-none"
                        onClick={() => repo.fullName && handleAnalyze(repo.fullName)}
                        disabled={!repo.fullName}
                      >
                        {repo.latestAnalysis ? 'Re-analyze' : 'Analyze'}
                      </Button>
                      {repo.latestAnalysis && repo.fullName && (
                        <Link href={`/scan/${encodeURIComponent(repo.fullName)}`}>
                          <Button size="sm" variant="outline" className="flex-1 sm:flex-none">
                            View Results
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                </div>
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
