'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ClientOnlyDate } from '@/components/client-only-date';

interface ComparisonCardProps {
  currentScore: number;
  previousScore?: number;
  currentSecurityScore?: number;
  previousSecurityScore?: number;
  currentPerformanceScore?: number;
  previousPerformanceScore?: number;
  currentMaintainabilityScore?: number;
  previousMaintainabilityScore?: number;
  previousAnalysisDate?: Date;
}

export function ComparisonCard({
  currentScore,
  previousScore,
  currentSecurityScore,
  previousSecurityScore,
  currentPerformanceScore,
  previousPerformanceScore,
  currentMaintainabilityScore,
  previousMaintainabilityScore,
  previousAnalysisDate,
}: ComparisonCardProps) {
  if (!previousScore && !previousSecurityScore && !previousPerformanceScore && !previousMaintainabilityScore) {
    return null; // No previous analysis to compare
  }

  const calculateDifference = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    const diff = current - previous;
    return {
      value: diff,
      percentage: ((diff / previous) * 100).toFixed(1),
      isPositive: diff >= 0,
    };
  };

  const overallDiff = calculateDifference(currentScore, previousScore);
  const securityDiff = calculateDifference(currentSecurityScore || 0, previousSecurityScore);
  const performanceDiff = calculateDifference(currentPerformanceScore || 0, previousPerformanceScore);
  const maintainabilityDiff = calculateDifference(currentMaintainabilityScore || 0, previousMaintainabilityScore);

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">📈</span>
          <span>Score Improvement</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Score */}
          {overallDiff && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overall Health</div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold">{previousScore}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {currentScore}
                  </span>
                  <Badge
                    variant={overallDiff.isPositive ? 'default' : 'destructive'}
                    className={
                      overallDiff.isPositive
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    }
                  >
                    {overallDiff.isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {overallDiff.isPositive ? '+' : ''}
                    {overallDiff.value}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Category Scores */}
          <div className="grid md:grid-cols-3 gap-3">
            {securityDiff && (
              <div className="p-3 rounded-lg bg-background/50 border">
                <div className="text-xs text-muted-foreground mb-1">Security</div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{previousSecurityScore}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {currentSecurityScore}
                  </span>
                  {securityDiff.value !== 0 && (
                    <span
                      className={`text-xs font-medium ${
                        securityDiff.isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {securityDiff.isPositive ? '+' : ''}
                      {securityDiff.value}
                    </span>
                  )}
                </div>
              </div>
            )}

            {performanceDiff && (
              <div className="p-3 rounded-lg bg-background/50 border">
                <div className="text-xs text-muted-foreground mb-1">Performance</div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{previousPerformanceScore}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {currentPerformanceScore}
                  </span>
                  {performanceDiff.value !== 0 && (
                    <span
                      className={`text-xs font-medium ${
                        performanceDiff.isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {performanceDiff.isPositive ? '+' : ''}
                      {performanceDiff.value}
                    </span>
                  )}
                </div>
              </div>
            )}

            {maintainabilityDiff && (
              <div className="p-3 rounded-lg bg-background/50 border">
                <div className="text-xs text-muted-foreground mb-1">Maintainability</div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{previousMaintainabilityScore}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {currentMaintainabilityScore}
                  </span>
                  {maintainabilityDiff.value !== 0 && (
                    <span
                      className={`text-xs font-medium ${
                        maintainabilityDiff.isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {maintainabilityDiff.isPositive ? '+' : ''}
                      {maintainabilityDiff.value}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {previousAnalysisDate && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Compared to analysis from{' '}
              <ClientOnlyDate date={previousAnalysisDate} format="relative" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
