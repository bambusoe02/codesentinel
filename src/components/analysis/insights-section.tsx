'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  type: 'positive' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface InsightsSectionProps {
  insights: Insight[];
}

export function InsightsSection({ insights }: InsightsSectionProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-purple-500" />
          <span>Key Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const styles = getTypeStyles(insight.type);
            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border',
                  styles.bg,
                  styles.border
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className={cn('text-2xl', styles.icon)}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    {insight.actionLabel && insight.onAction && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={insight.onAction}
                        className="mt-2"
                      >
                        {insight.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate insights from analysis data
export function generateInsights(
  overallScore: number,
  previousScore?: number,
  securityScore?: number,
  performanceScore?: number,
  maintainabilityScore?: number,
  issuesCount?: number
): Insight[] {
  const insights: Insight[] = [];

  // Score improvement insight
  if (previousScore !== undefined) {
    const improvement = overallScore - previousScore;
    if (improvement > 0) {
      insights.push({
        type: 'positive',
        icon: '📈',
        title: 'Improvement Trend',
        description: `Your score has improved by ${improvement} points since the last analysis. Great progress!`,
      });
    } else if (improvement < 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Score Decline',
        description: `Your score has decreased by ${Math.abs(improvement)} points. Review recent changes to identify the cause.`,
      });
    }
  }

  // Security insight
  if (securityScore !== undefined) {
    if (securityScore >= 90) {
      insights.push({
        type: 'positive',
        icon: '🛡️',
        title: 'Strong Security',
        description: 'No critical vulnerabilities detected. Your dependencies are up to date and security best practices are followed.',
      });
    } else if (securityScore < 70) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Security Concerns',
        description: 'Several security issues detected. Consider updating dependencies and reviewing authentication mechanisms.',
        actionLabel: 'View Security Issues',
      });
    }
  }

  // Performance insight
  if (performanceScore !== undefined && performanceScore < 75) {
    insights.push({
      type: 'warning',
      icon: '⚡',
      title: 'Performance Opportunity',
      description: 'Consider lazy loading heavy components and optimizing bundle size to improve initial load time by ~30%.',
      actionLabel: 'View Performance Issues',
    });
  }

  // Perfect score insight
  if (overallScore === 100) {
    insights.push({
      type: 'positive',
      icon: '🎉',
      title: 'Perfect Score!',
      description: 'Congratulations! Your repository meets all best practices. Keep up the excellent work!',
    });
  }

  // Issues count insight
  if (issuesCount !== undefined) {
    if (issuesCount === 0) {
      insights.push({
        type: 'positive',
        icon: '✅',
        title: 'No Issues Found',
        description: 'Your codebase is clean and follows best practices across all categories.',
      });
    } else if (issuesCount > 20) {
      insights.push({
        type: 'warning',
        icon: '📋',
        title: 'Multiple Issues Detected',
        description: `${issuesCount} issues found across different categories. Prioritize critical and high-severity issues first.`,
        actionLabel: 'View All Issues',
      });
    }
  }

  // Maintainability insight
  if (maintainabilityScore !== undefined && maintainabilityScore < 70) {
    insights.push({
      type: 'info',
      icon: '🔧',
      title: 'Maintainability Improvement',
      description: 'Consider refactoring complex functions, improving code documentation, and establishing coding standards.',
      actionLabel: 'View Recommendations',
    });
  }

  return insights.slice(0, 4); // Limit to 4 insights
}
