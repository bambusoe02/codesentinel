'use client';

import { useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CodeHighlights } from './code-highlights';
import { ComparisonCard } from '@/components/analysis/comparison-card';
import { IssueCard } from '@/components/analysis/issue-card';
import { InsightsSection, generateInsights } from '@/components/analysis/insights-section';
import { AnalysisIssue } from '@/lib/schema';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Code,
  Clock,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Lazy load heavy components
const TrendChart = lazy(() =>
  import('@/components/analysis/trend-chart').then((mod) => ({ default: mod.TrendChart }))
);

interface ScanResultsProps {
  repoName: string;
}

async function fetchAnalysisResults(repoName: string) {
  try {
    const encodedRepoName = encodeURIComponent(repoName);
    const url = `/api/repositories/${encodedRepoName}/results`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 404 gracefully - analysis might not exist yet
      if (response.status === 404) {
        console.log('Analysis not found (404) - this is normal if analysis is in progress');
        throw new Error('ANALYSIS_NOT_FOUND'); // Special error code
      }
      
      const errorMessage = data.error || data.details || `Failed to fetch analysis results: ${response.status}`;
      console.error('Failed to fetch analysis results:', {
        status: response.status,
        error: errorMessage,
        data,
      });
      throw new Error(errorMessage);
    }

    if (!data.report) {
      console.error('API returned success but no report:', data);
      throw new Error('Invalid response: report missing');
    }

    console.log('Fetched analysis results successfully:', {
      reportId: data.report.id,
      isAIPowered: data.report.isAIPowered,
      overallScore: data.report.overallScore,
      createdAt: data.report.createdAt,
    });

    return data.report;
  } catch (error) {
    console.error('Error in fetchAnalysisResults:', error);
    throw error;
  }
}

async function fetchAnalysisHistory(repoName: string, range: string = '30d') {
  const response = await fetch(
    `/api/repositories/${encodeURIComponent(repoName)}/history?range=${range}&limit=30`
  );
  if (!response.ok) {
    return { history: [] };
  }
  const data = await response.json();
  return data;
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getStatus(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}

function calculateCategoryScore(
  issues: AnalysisIssue[],
  category: string
): number {
  const categoryIssues = issues.filter((issue) => issue.type === category);

  if (categoryIssues.length === 0) {
    return 100; // Perfect score if no issues
  }

  let penalty = 0;
  categoryIssues.forEach((issue) => {
    switch (issue.severity) {
      case 'critical':
        penalty += 15;
        break;
      case 'high':
        penalty += 10;
        break;
      case 'medium':
        penalty += 5;
        break;
      case 'low':
        penalty += 2;
        break;
    }
  });

  return Math.max(0, 100 - Math.min(penalty, 100));
}

export function ScanResults({ repoName }: ScanResultsProps) {
  // ✅ ALL HOOKS AT TOP - BEFORE ANY CONDITIONAL RETURNS
  const queryClient = useQueryClient();
  const { data: report, isLoading, error, refetch, isError } = useQuery({
    queryKey: ['analysis-results', repoName],
    queryFn: () => fetchAnalysisResults(repoName),
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 (analysis not found) - this is expected
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (message === 'ANALYSIS_NOT_FOUND' || message.includes('404') || message.includes('not found')) {
          return false; // Don't retry - analysis doesn't exist yet
        }
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    refetchInterval: (query) => {
      // Only poll if we got ANALYSIS_NOT_FOUND (404) - analysis might be in progress
      if (query.state.error && 
          typeof query.state.error === 'object' && 
          'message' in query.state.error &&
          String(query.state.error.message) === 'ANALYSIS_NOT_FOUND') {
        // Poll every 5 seconds while waiting for analysis to complete
        return 5000;
      }
      // Don't poll if we have data or other errors
      return false;
    },
    staleTime: 0, // Always consider data stale - fetch fresh on mount
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Fetch analysis history for comparison and trends
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['analysis-history', repoName],
    queryFn: () => fetchAnalysisHistory(repoName),
    enabled: !!report, // Only fetch if we have current report
  });

  // Extract and memoize data BEFORE conditionals
  const rawIssues = useMemo(() => (report?.issues as AnalysisIssue[]) || [], [report?.issues]);
  
  // Calculate category scores - memoize to prevent recalculation
  const categoryScores = useMemo(() => ({
    security: calculateCategoryScore(rawIssues, 'security'),
    performance: calculateCategoryScore(rawIssues, 'performance'),
    maintainability: calculateCategoryScore(rawIssues, 'maintainability'),
  }), [rawIssues]);

  const overallScore = report?.overallScore || 0;
  const recommendations = report?.recommendations || [];
  const securityScore = categoryScores.security;
  const performanceScore = categoryScores.performance;
  const maintainabilityScore = categoryScores.maintainability;
  
  // Check if analysis was AI-powered (from report metadata or default to false)
  // isAIPowered is stored as integer (0 or 1) in database
  const isAIPowered = report 
    ? (report.isAIPowered === 1 || 
       report.isAIPowered === true ||
       (report as { isAIPowered?: number | boolean })?.isAIPowered === 1 ||
       (report as { isAIPowered?: number | boolean })?.isAIPowered === true)
    : false;
  
  // Debug logging (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && report) {
    console.log('✅ Analysis loaded:', {
      reportId: report.id,
      isAIPowered,
      reportIsAIPowered: report.isAIPowered,
      overallScore: report.overallScore,
      issuesCount: Array.isArray(report.issues) ? report.issues.length : 0,
      createdAt: report.createdAt,
    });
  }

  // Get previous analysis for comparison
  const previousAnalysis = historyData?.history?.[1];
  const previousScore = previousAnalysis?.overallScore;
  const previousSecurityScore = previousAnalysis?.securityScore;
  const previousPerformanceScore = previousAnalysis?.performanceScore;
  const previousMaintainabilityScore = previousAnalysis?.maintainabilityScore;

  // Prepare trend data
  const trendData = useMemo(() => {
    if (!historyData?.history) return [];
    return historyData.history.map((item: typeof previousAnalysis) => ({
      date: item.createdAt,
      overallScore: item.overallScore,
      securityScore: item.securityScore || 0,
      performanceScore: item.performanceScore || 0,
      maintainabilityScore: item.maintainabilityScore || 0,
    }));
  }, [historyData]);

  // Group issues by type - memoized with stable dependencies
  const issuesByType = useMemo(() => ({
    security: rawIssues.filter((i: AnalysisIssue) => i.type === 'security'),
    performance: rawIssues.filter((i: AnalysisIssue) => i.type === 'performance'),
    maintainability: rawIssues.filter((i: AnalysisIssue) => i.type === 'maintainability'),
    reliability: rawIssues.filter((i: AnalysisIssue) => i.type === 'reliability'),
  }), [rawIssues]);

  // Generate insights - memoized with stable dependencies
  const insights = useMemo(
    () =>
      generateInsights(
        overallScore,
        previousScore,
        securityScore,
        performanceScore,
        maintainabilityScore,
        rawIssues.length
      ),
    [
      overallScore,
      previousScore,
      securityScore,
      performanceScore,
      maintainabilityScore,
      rawIssues.length,
    ]
  );

  // ✅ NOW conditionals and early returns
  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Score skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto mb-4" />
              <Skeleton className="h-2 w-full max-w-md mx-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Category skeletons */}
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error handling - check for ANALYSIS_NOT_FOUND (404) which means analysis is in progress
  if (isError && error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage === 'ANALYSIS_NOT_FOUND' || errorMessage.includes('404') || errorMessage.includes('not found')) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Analysis in progress</h3>
              <p className="text-muted-foreground mb-4">
                The analysis for this repository is still running. Results will appear here when complete.
                <br />
                <span className="text-sm">This page will automatically refresh...</span>
              </p>
              <Button 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['analysis-results', repoName] });
                  refetch();
                }} 
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  if (isError && !report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading results</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Failed to load analysis results'}
            </p>
            <Button onClick={() => {
              refetch();
              window.location.reload();
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No analysis results yet</h3>
            <p className="text-muted-foreground mb-4">
              Start an analysis to see results here.
            </p>
            <Button onClick={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['analysis-results', repoName] });
            }} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categories = [
    {
      id: 'security',
      title: 'Security',
      score: securityScore,
      grade: getGrade(securityScore),
      issuesCount: issuesByType.security.length,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      issues: issuesByType.security,
    },
    {
      id: 'performance',
      title: 'Performance',
      score: performanceScore,
      grade: getGrade(performanceScore),
      issuesCount: issuesByType.performance.length,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      issues: issuesByType.performance,
    },
    {
      id: 'maintainability',
      title: 'Maintainability',
      score: maintainabilityScore,
      grade: getGrade(maintainabilityScore),
      issuesCount: issuesByType.maintainability.length,
      icon: Code,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      issues: issuesByType.maintainability,
    },
  ];

  const overall = {
    score: overallScore,
    grade: getGrade(overallScore),
    status: getStatus(overallScore),
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Analysis Results</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ['analysis-results', repoName] });
            queryClient.invalidateQueries({ queryKey: ['analysis-history', repoName] });
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            // Force refetch
            await refetch();
            // Also refetch history if available
            if (historyData) {
              queryClient.refetchQueries({ queryKey: ['analysis-history', repoName] });
            }
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Overall Score */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            {/* AI Mode Badge - Always visible when report exists */}
            {report && (
              <div className="flex justify-center mb-2">
                <Badge
                  variant={isAIPowered ? 'default' : 'secondary'}
                  className={isAIPowered ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                >
                  {isAIPowered ? '🤖 AI Analysis' : '📋 Rule-based'}
                </Badge>
              </div>
            )}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-purple-500/50">
              <span className="text-2xl font-bold text-white transition-all duration-500">{overall.score}</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Health Score: {overall.grade}</h2>
            <p className="text-muted-foreground mb-4">{overall.status} overall health</p>
            <Progress value={overall.score} className="w-full max-w-md mx-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Comparison Card */}
      {previousScore !== undefined && (
        <ComparisonCard
          currentScore={overallScore}
          previousScore={previousScore}
          currentSecurityScore={securityScore}
          previousSecurityScore={previousSecurityScore}
          currentPerformanceScore={performanceScore}
          previousPerformanceScore={previousPerformanceScore}
          currentMaintainabilityScore={maintainabilityScore}
          previousMaintainabilityScore={previousMaintainabilityScore}
          previousAnalysisDate={previousAnalysis?.createdAt ? new Date(previousAnalysis.createdAt) : undefined}
        />
      )}

      {/* Insights Section */}
      {insights.length > 0 && <InsightsSection insights={insights} />}

      {/* Category Scores */}
      <div className="grid md:grid-cols-3 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.id} className={`${category.bgColor} ${category.borderColor} border-2`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${category.bgColor}`}>
                    <Icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <Badge variant="outline" className={category.color}>
                    {category.grade}
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">{category.title}</h3>
                <div className="text-2xl font-bold mb-2">{category.score}/100</div>
                <Progress value={category.score} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {category.issuesCount} issue{category.issuesCount !== 1 ? 's' : ''} found
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintainability">Maintainability</TabsTrigger>
          <TabsTrigger value="code">Code Review</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                  <span>{category.title} Issues</span>
                  <Badge variant="outline">{category.issuesCount} found</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {category.issues.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No {category.title} Issues Found!
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Your code meets all {category.title.toLowerCase()} best practices.
                    </p>
                    <p className="text-2xl">🎉</p>
                  </div>
                ) : (
          <div className="space-y-4">
            {category.issues.map((issue: AnalysisIssue) => (
              <IssueCard key={issue.id || `issue-${issue.title}`} issue={issue} />
            ))}
          </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="code">
          <CodeHighlights issues={[]} files={[]} />
        </TabsContent>

        <TabsContent value="trends">
          <Suspense 
            fallback={
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            }
          >
            <TrendChart data={trendData} isLoading={isHistoryLoading} />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Repository Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{rawIssues.length}</div>
              <div className="text-sm text-muted-foreground">Issues Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{recommendations.length}</div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overall.score}/100</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{overall.grade}</div>
              <div className="text-sm text-muted-foreground">Grade</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}