'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

async function fetchRecentActivity() {
  const response = await fetch('/api/analysis/recent');
  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }
  const data = await response.json();
  return data.activities || [];
}

export function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
  });

  const formattedActivities = useMemo(() => {
    return activities.map((activity: any) => {
      const issuesCount = Array.isArray(activity.issues) ? activity.issues.length : 0;
      const hasIssues = issuesCount > 0;
      
      return {
        id: activity.id,
        title: `Analysis completed for ${activity.repositoryName}`,
        description: `Score: ${activity.overallScore}/100${issuesCount > 0 ? `, ${issuesCount} issue${issuesCount !== 1 ? 's' : ''} found` : ''}`,
        time: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }),
        icon: hasIssues ? AlertTriangle : CheckCircle,
        color: hasIssues ? 'text-yellow-600' : 'text-green-600',
      };
    });
  }, [activities]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {formattedActivities.map((activity: { id: string; title: string; description: string; time: string; icon: any; color: string }) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {formattedActivities.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent activity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
