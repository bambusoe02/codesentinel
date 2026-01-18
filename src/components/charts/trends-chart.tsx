'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  GitBranch,
  Users,
  Code,
  AlertTriangle,
} from 'lucide-react';

// Mock data - in real app this would come from GitHub API
const commitData = [
  { date: '2024-01-01', commits: 12, additions: 456, deletions: 123 },
  { date: '2024-01-08', commits: 8, additions: 234, deletions: 89 },
  { date: '2024-01-15', commits: 15, additions: 567, deletions: 234 },
  { date: '2024-01-22', commits: 22, additions: 789, deletions: 345 },
  { date: '2024-01-29', commits: 18, additions: 623, deletions: 278 },
  { date: '2024-02-05', commits: 25, additions: 891, deletions: 456 },
  { date: '2024-02-12', commits: 20, additions: 734, deletions: 312 },
  { date: '2024-02-19', commits: 16, additions: 523, deletions: 198 },
  { date: '2024-02-26', commits: 14, additions: 445, deletions: 167 },
  { date: '2024-03-05', commits: 28, additions: 934, deletions: 523 },
  { date: '2024-03-12', commits: 19, additions: 678, deletions: 289 },
  { date: '2024-03-19', commits: 23, additions: 812, deletions: 367 },
];

const issueData = [
  { date: '2024-01-01', opened: 5, closed: 3, bugs: 2, features: 1, security: 0 },
  { date: '2024-01-08', opened: 3, closed: 4, bugs: 1, features: 2, security: 0 },
  { date: '2024-01-15', opened: 7, closed: 2, bugs: 3, features: 1, security: 1 },
  { date: '2024-01-22', opened: 4, closed: 5, bugs: 2, features: 2, security: 0 },
  { date: '2024-01-29', opened: 6, closed: 3, bugs: 1, features: 3, security: 0 },
  { date: '2024-02-05', opened: 8, closed: 6, bugs: 4, features: 2, security: 1 },
  { date: '2024-02-12', opened: 5, closed: 4, bugs: 2, features: 1, security: 0 },
  { date: '2024-02-19', opened: 3, closed: 7, bugs: 1, features: 2, security: 0 },
  { date: '2024-02-26', opened: 9, closed: 5, bugs: 3, features: 3, security: 1 },
  { date: '2024-03-05', opened: 6, closed: 8, bugs: 2, features: 4, security: 0 },
  { date: '2024-03-12', opened: 4, closed: 3, bugs: 1, features: 1, security: 0 },
  { date: '2024-03-19', opened: 7, closed: 6, bugs: 2, features: 3, security: 1 },
];

const contributorData = [
  { week: 'Week 1', contributors: 3, newContributors: 1 },
  { week: 'Week 2', contributors: 4, newContributors: 1 },
  { week: 'Week 3', contributors: 5, newContributors: 2 },
  { week: 'Week 4', contributors: 6, newContributors: 1 },
  { week: 'Week 5', contributors: 7, newContributors: 1 },
  { week: 'Week 6', contributors: 8, newContributors: 2 },
  { week: 'Week 7', contributors: 8, newContributors: 0 },
  { week: 'Week 8', contributors: 9, newContributors: 1 },
  { week: 'Week 9', contributors: 10, newContributors: 2 },
  { week: 'Week 10', contributors: 11, newContributors: 1 },
  { week: 'Week 11', contributors: 12, newContributors: 1 },
  { week: 'Week 12', contributors: 12, newContributors: 0 },
];

interface TrendsChartProps {
  repoName: string;
}

export function TrendsChart({ repoName }: TrendsChartProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">234</div>
                <div className="text-xs text-muted-foreground">Total Commits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">Contributors</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">+4.2K</div>
                <div className="text-xs text-muted-foreground">Lines Added</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">23</div>
                <div className="text-xs text-muted-foreground">Open Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="commits" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commits">Commit Activity</TabsTrigger>
          <TabsTrigger value="issues">Issue Trends</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>

        <TabsContent value="commits">
          <Card>
            <CardHeader>
              <CardTitle>Commit Activity Over Time</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Commits</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span>Additions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span>Deletions</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={commitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value, name) => [
                      value,
                      name === 'additions' ? 'Lines Added' :
                      name === 'deletions' ? 'Lines Deleted' : 'Commits'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="commits"
                    stackId="1"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="additions"
                    stackId="2"
                    stroke="#16a34a"
                    fill="#16a34a"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="deletions"
                    stackId="3"
                    stroke="#dc2626"
                    fill="#dc2626"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Issue Activity</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Opened</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span>Closed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span>Bugs</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={issueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={(value) => formatDate(value)}
                  />
                  <Bar dataKey="opened" fill="#2563eb" name="Opened" />
                  <Bar dataKey="closed" fill="#16a34a" name="Closed" />
                  <Bar dataKey="bugs" fill="#dc2626" name="Bugs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributors">
          <Card>
            <CardHeader>
              <CardTitle>Contributor Growth</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Total Contributors</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span>New Contributors</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contributorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="contributors"
                    stroke="#2563eb"
                    strokeWidth={3}
                    name="Total Contributors"
                  />
                  <Line
                    type="monotone"
                    dataKey="newContributors"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="New Contributors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
