// Simple in-memory database for demo purposes
// In production, replace with a proper database solution
// Note: Removed drizzle-orm imports to avoid dependencies

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  language: string;
  topics: string[];
}

interface AnalysisIssue {
  id: string;
  type: 'security' | 'performance' | 'maintainability' | 'reliability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
}

interface Recommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  priority: number;
  impact: string;
}

interface AnalysisReport {
  id: string;
  repositoryId: string;
  overallScore: number;
  issues: AnalysisIssue[];
  recommendations: Recommendation[];
  createdAt: string;
  shareToken?: string;
}

// Mock data for demo
const mockRepositories: Repository[] = [
  {
    id: '1',
    name: 'react-app',
    full_name: 'user/react-app',
    description: 'A modern React application',
    html_url: 'https://github.com/user/react-app',
    owner: {
      login: 'demo-user',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    pushed_at: '2024-01-15T00:00:00Z',
    stargazers_count: 42,
    language: 'TypeScript',
    topics: ['react', 'typescript', 'web']
  },
  {
    id: '2',
    name: 'api-server',
    full_name: 'user/api-server',
    description: 'REST API server built with Node.js',
    html_url: 'https://github.com/user/api-server',
    owner: {
      login: 'demo-user',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
    pushed_at: '2024-01-14T00:00:00Z',
    stargazers_count: 28,
    language: 'JavaScript',
    topics: ['nodejs', 'api', 'rest']
  }
];

const mockReports: AnalysisReport[] = [
  {
    id: 'report-1',
    repositoryId: '1',
    overallScore: 85,
    issues: [
      { id: '1', type: 'security', severity: 'medium', title: 'Outdated dependencies' },
      { id: '2', type: 'performance', severity: 'low', title: 'Bundle size optimization' }
    ],
    recommendations: [
      { id: '1', type: 'immediate', title: 'Update npm packages', description: 'Update outdated dependencies to fix security vulnerabilities', priority: 8, impact: 'Prevent security breaches and data loss' },
      { id: '2', type: 'short-term', title: 'Implement code splitting', description: 'Split code into smaller chunks for better performance', priority: 6, impact: 'Improve loading times and user experience' }
    ],
    createdAt: '2024-01-15T10:00:00Z'
  }
];

// Mock database operations
export const db = {
  // Repository operations
  select: () => ({
    from: () => ({
      where: () => mockRepositories,
      limit: () => mockRepositories.slice(0, 10)
    })
  }),

  // Analysis reports operations
  insert: () => ({
    values: (data: Omit<AnalysisReport, 'id'>) => ({
      returning: () => [{ id: `report-${Date.now()}`, ...data }]
    })
  }),

  // Mock query builder
  query: {
    repositories: {
      findMany: () => mockRepositories
    },
    analysisReports: {
      findMany: () => mockReports
    }
  }
};

export type DB = typeof db;
