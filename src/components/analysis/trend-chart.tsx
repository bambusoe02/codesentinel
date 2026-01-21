'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  overallScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
}

interface TrendChartProps {
  data?: TrendDataPoint[];
  isLoading?: boolean;
}

export function TrendChart({ data = [], isLoading = false }: TrendChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Score Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No historical data available yet. Run more analyses to see trends.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter data based on time range
  let filteredData = data;
  if (timeRange === '7d') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filteredData = data.filter((point) => new Date(point.date) >= sevenDaysAgo);
  } else if (timeRange === '30d') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filteredData = data.filter((point) => new Date(point.date) >= thirtyDaysAgo);
  }

  // Sort by date
  filteredData = [...filteredData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Score Trends</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('all')}
            >
              All Time
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              stroke="#888"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis stroke="#888" domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
              }}
              formatter={(value: number | undefined) => [`${value ?? 0}/100`, '']}
              labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="overallScore"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Overall"
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="securityScore"
              stroke="#10b981"
              strokeWidth={2}
              name="Security"
              dot={{ fill: '#10b981', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="performanceScore"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Performance"
              dot={{ fill: '#f59e0b', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="maintainabilityScore"
              stroke="#ef4444"
              strokeWidth={2}
              name="Maintainability"
              dot={{ fill: '#ef4444', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
