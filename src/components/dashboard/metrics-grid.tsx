'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Github,
  Code,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

// Mock data - in real app this would come from API
const metrics = [
  {
    title: 'Total Repositories',
    value: '24',
    change: '+3',
    changeType: 'positive' as const,
    icon: Github,
    description: 'Connected repositories',
  },
  {
    title: 'Lines of Code',
    value: '1.2M',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Code,
    description: 'Across all repositories',
  },
  {
    title: 'Active Analyses',
    value: '8',
    change: '+2',
    changeType: 'positive' as const,
    icon: FileText,
    description: 'Currently processing',
  },
  {
    title: 'Issues Found',
    value: '156',
    change: '-23',
    changeType: 'negative' as const,
    icon: AlertTriangle,
    description: 'Resolved this month',
  },
];

export function MetricsGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Badge
                  variant={
                    metric.changeType === 'positive'
                      ? 'default'
                      : metric.changeType === 'negative'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {metric.change}
                </Badge>
                <span>{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
