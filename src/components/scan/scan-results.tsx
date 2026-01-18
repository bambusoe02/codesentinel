'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeHighlights } from './code-highlights';
import { TrendsChart } from '@/components/charts/trends-chart';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Code,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  GitBranch,
  Users,
  Star,
} from 'lucide-react';

// Mock analysis results - in real app this would come from AI analysis
const analysisResults = {
  overall: {
    score: 78,
    grade: 'B',
    status: 'Good',
  },
  categories: [
    {
      id: 'security',
      title: 'Security',
      score: 85,
      grade: 'A',
      issuesCount: 2,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      issues: [
        {
          severity: 'high',
          title: 'Exposed API keys in configuration',
          description: 'Found hardcoded API keys in config files',
          file: 'config/production.js',
          line: 15,
          fix: 'Move sensitive data to environment variables',
        },
        {
          severity: 'medium',
          title: 'Outdated dependencies',
          description: 'Several packages have known vulnerabilities',
          file: 'package.json',
          line: null,
          fix: 'Update to latest secure versions',
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      score: 72,
      grade: 'B',
      issuesCount: 5,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      issues: [
        {
          severity: 'medium',
          title: 'Large bundle size',
          description: 'Main bundle exceeds recommended size limit',
          file: 'build/static/js/main.js',
          line: null,
          fix: 'Implement code splitting and lazy loading',
        },
      ],
    },
    {
      id: 'maintainability',
      title: 'Maintainability',
      score: 65,
      grade: 'C',
      issuesCount: 12,
      icon: Code,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      issues: [
        {
          severity: 'low',
          title: 'Code duplication',
          description: 'Similar code patterns repeated across files',
          file: 'src/components/',
          line: null,
          fix: 'Extract common functionality into reusable components',
        },
      ],
    },
  ],
  repository: {
    linesOfCode: 15420,
    filesCount: 247,
    languages: {
      TypeScript: 65,
      JavaScript: 25,
      JSON: 8,
      Other: 2,
    },
    contributors: 8,
    lastCommit: '2 hours ago',
    branches: 12,
    stars: 45,
    forks: 12,
  },
};

interface ScanResultsProps {
  repoName: string;
}

export function ScanResults({ repoName }: ScanResultsProps) {
  const { overall, categories, repository } = analysisResults;

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
                  {category.issues.map((issue, index) => (
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
          <TrendsChart repoName={repoName} />
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
              <div className="text-2xl font-bold">{repository.linesOfCode.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Lines of Code</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{repository.filesCount}</div>
              <div className="text-sm text-muted-foreground">Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{repository.contributors}</div>
              <div className="text-sm text-muted-foreground">Contributors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{repository.branches}</div>
              <div className="text-sm text-muted-foreground">Branches</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-4">Language Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(repository.languages).map(([lang, percentage]) => (
                <div key={lang} className="flex items-center justify-between">
                  <span className="text-sm">{lang}</span>
                  <div className="flex items-center space-x-2 flex-1 mx-4">
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-12">
                      {percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
