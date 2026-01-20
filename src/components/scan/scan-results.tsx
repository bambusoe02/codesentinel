'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CodeHighlights } from './code-highlights';
import { TrendsChart } from '@/components/charts/trends-chart';
import { AnalysisIssue } from '@/lib/analyzer';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Code,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ScanResultsProps {
  repoName: string;
}

async function fetchAnalysisResults(repoName: string) {
  const response = await fetch(`/api/repositories/${encodeURIComponent(repoName)}/results`);
  if (!response.ok) {
    throw new Error('Failed to fetch analysis results');
  }
  const data = await response.json();
  return data.report;
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

export function ScanResults({ repoName }: ScanResultsProps) {
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['analysis-results', repoName],
    queryFn: () => fetchAnalysisResults(repoName),
    retry: false,
    refetchInterval: (query) => {
      // Poll every 5 seconds if no data yet
      return query.state.data ? false : 5000;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No analysis results found</h3>
            <p className="text-muted-foreground mb-4">
              Start an analysis to see results here.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallScore = report.overallScore || 0;
  const issues = report.issues || [];
  const recommendations = report.recommendations || [];

  // Group issues by type
  const issuesByType = {
    security: issues.filter((i: AnalysisIssue) => i.type === 'security'),
    performance: issues.filter((i: AnalysisIssue) => i.type === 'performance'),
    maintainability: issues.filter((i: AnalysisIssue) => i.type === 'maintainability'),
    reliability: issues.filter((i: AnalysisIssue) => i.type === 'reliability'),
  };

  const categories = [
    {
      id: 'security',
      title: 'Security',
      score: 85, // TODO: Calculate from issues
      grade: 'A',
      issuesCount: issuesByType.security.length,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      issues: issuesByType.security.slice(0, 5),
    },
    {
      id: 'performance',
      title: 'Performance',
      score: 72, // TODO: Calculate from issues
      grade: 'B',
      issuesCount: issuesByType.performance.length,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      issues: issuesByType.performance.slice(0, 5),
    },
    {
      id: 'maintainability',
      title: 'Maintainability',
      score: 65, // TODO: Calculate from issues
      grade: 'C',
      issuesCount: issuesByType.maintainability.length,
      icon: Code,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      issues: issuesByType.maintainability.slice(0, 5),
    },
  ];

  const overall = {
    score: overallScore,
    grade: getGrade(overallScore),
    status: getStatus(overallScore),
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
              <span className="text-2xl font-bold text-white">{overall.score}</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Health Score: {overall.grade}</h2>
            <p className="text-muted-foreground mb-4">{overall.status} overall health</p>
            <Progress value={overall.score} className="w-full max-w-md mx-auto" />
          </div>
        </CardContent>
      </Card>

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
                  {category.issuesCount} issues found
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
                <div className="space-y-4">
                  {category.issues.map((issue: AnalysisIssue, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {issue.severity === 'high' && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          {issue.severity === 'medium' && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          {issue.severity === 'low' && (
                            <Clock className="w-4 h-4 text-blue-500" />
                          )}
                          <h4 className="font-medium">{issue.title}</h4>
                        </div>
                        <Badge
                          variant={
                            issue.severity === 'high'
                              ? 'destructive'
                              : issue.severity === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {issue.description}
                      </p>
                      {issue.file && (
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                          <FileText className="w-3 h-3" />
                          <span>{issue.file}</span>
                          {issue.line && <span>Line {issue.line}</span>}
                        </div>
                      )}
                      <div className="bg-muted p-3 rounded text-sm">
                        <strong>Recommended Fix:</strong> {issue.fix}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="code">
          <CodeHighlights issues={[]} files={[]} />
        </TabsContent>

        <TabsContent value="trends">
          <TrendsChart />
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
              <div className="text-2xl font-bold">{issues.length}</div>
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

