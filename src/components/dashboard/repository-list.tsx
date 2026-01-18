'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Github,
  Star,
  GitFork,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

// Mock data - in real app this would come from API
const repositories = [
  {
    id: '1',
    name: 'react-app',
    fullName: 'company/react-app',
    description: 'Main React application with TypeScript',
    language: 'TypeScript',
    stars: 45,
    forks: 12,
    issues: 8,
    lastScan: '2 hours ago',
    status: 'completed',
    score: 85,
  },
  {
    id: '2',
    name: 'api-server',
    fullName: 'company/api-server',
    description: 'REST API server built with Node.js',
    language: 'JavaScript',
    stars: 23,
    forks: 8,
    issues: 15,
    lastScan: '1 day ago',
    status: 'completed',
    score: 72,
  },
  {
    id: '3',
    name: 'mobile-app',
    fullName: 'company/mobile-app',
    description: 'React Native mobile application',
    language: 'TypeScript',
    stars: 67,
    forks: 18,
    issues: 3,
    lastScan: '3 days ago',
    status: 'completed',
    score: 91,
  },
  {
    id: '4',
    name: 'data-pipeline',
    fullName: 'company/data-pipeline',
    description: 'ETL pipeline for data processing',
    language: 'Python',
    stars: 12,
    forks: 4,
    issues: 22,
    lastScan: 'Never',
    status: 'pending',
    score: null,
  },
];

export function RepositoryList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Repositories</CardTitle>
        <Button variant="outline" size="sm">
          <Github className="w-4 h-4 mr-2" />
          Connect More
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    <Github className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium truncate">{repo.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {repo.language}
                    </Badge>
                    {repo.status === 'completed' && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Analyzed
                      </Badge>
                    )}
                    {repo.status === 'pending' && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Not Analyzed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {repo.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      {repo.stars}
                    </span>
                    <span className="flex items-center">
                      <GitFork className="w-3 h-3 mr-1" />
                      {repo.forks}
                    </span>
                    <span className="flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {repo.issues} issues
                    </span>
                    <span>Last scan: {repo.lastScan}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {repo.score && (
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {repo.score}/100
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Health Score
                    </div>
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  <Link href={`/scan/${repo.fullName}`}>
                    <Button size="sm" variant="outline">
                      {repo.status === 'completed' ? 'View Report' : 'Analyze'}
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {repositories.length === 0 && (
          <div className="text-center py-8">
            <Github className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No repositories connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your GitHub account to start analyzing your repositories.
            </p>
            <Button>
              <Github className="w-4 h-4 mr-2" />
              Connect GitHub
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
