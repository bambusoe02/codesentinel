'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Github,
  Code,
  FileText,
} from 'lucide-react';

// Mock data - in real app this would come from API
const activities = [
  {
    id: '1',
    type: 'analysis_completed',
    title: 'Analysis completed for react-app',
    description: 'Found 8 issues, score: 85/100',
    time: '2 hours ago',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    id: '2',
    type: 'repository_connected',
    title: 'Connected new repository',
    description: 'data-pipeline added to monitoring',
    time: '1 day ago',
    icon: Github,
    color: 'text-blue-600',
  },
  {
    id: '3',
    type: 'issues_found',
    title: 'Security issues detected',
    description: '3 high-priority vulnerabilities in api-server',
    time: '1 day ago',
    icon: AlertTriangle,
    color: 'text-red-600',
  },
  {
    id: '4',
    type: 'analysis_started',
    title: 'Analysis started',
    description: 'Scanning mobile-app repository',
    time: '3 days ago',
    icon: Clock,
    color: 'text-yellow-600',
  },
  {
    id: '5',
    type: 'report_generated',
    title: 'PDF report generated',
    description: 'Monthly summary report ready',
    time: '1 week ago',
    icon: FileText,
    color: 'text-purple-600',
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
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
        {activities.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent activity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
