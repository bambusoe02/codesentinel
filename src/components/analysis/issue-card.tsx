'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnalysisIssue } from '@/lib/schema';
import {
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Code,
  Lightbulb,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: AnalysisIssue;
  index: number;
}

export function IssueCard({ issue, index }: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityIcon = () => {
    switch (issue.severity) {
      case 'critical':
      case 'high':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (): 'destructive' | 'default' | 'secondary' => {
    switch (issue.severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getImpactColor = (impact?: string) => {
    if (!impact) return 'text-muted-foreground';
    const lowerImpact = impact.toLowerCase();
    if (lowerImpact.includes('high') || lowerImpact.includes('critical')) {
      return 'text-red-600 dark:text-red-400';
    }
    if (lowerImpact.includes('medium')) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isExpanded && 'border-purple-300 dark:border-purple-700 shadow-lg'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        {/* Collapsed Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {getSeverityIcon()}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-base">{issue.title}</h4>
                <Badge variant={getSeverityBadgeVariant()} className="text-xs">
                  {issue.severity}
                </Badge>
                {issue.effort && (
                  <Badge variant="outline" className="text-xs">
                    {issue.effort} effort
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {issue.description}
              </p>
              {issue.file && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <FileText className="w-3 h-3" />
                  <span>{issue.file}</span>
                  {issue.line && <span>• Line {issue.line}</span>}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {/* Affected Files */}
            {issue.file && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Affected Files:</label>
                </div>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  {issue.file}
                  {issue.line && (
                    <span className="text-muted-foreground"> (line {issue.line})</span>
                  )}
                </div>
              </div>
            )}

            {/* Why This Matters */}
            {issue.impact && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Why this matters:</label>
                </div>
                <p className={cn('text-sm', getImpactColor(issue.impact))}>
                  {issue.impact}
                </p>
              </div>
            )}

            {/* How to Fix */}
            {issue.fix && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">How to fix:</label>
                </div>
                {issue.code ? (
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      <code>{issue.code}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm bg-muted p-3 rounded-lg">{issue.fix}</p>
                )}
              </div>
            )}

            {/* Code Snippet */}
            {issue.code && issue.fix && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Code Example:</label>
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 p-3 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-slate-100 font-mono">
                    <code>{issue.code}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {issue.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Impact on Score */}
            {issue.effort && (
              <div className="text-xs text-muted-foreground italic">
                Impact on score: {issue.effort === 'high' ? 'High' : issue.effort === 'medium' ? 'Medium' : 'Low'} impact on {issue.type} score
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
