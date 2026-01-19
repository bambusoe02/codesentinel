import { create } from 'zustand';

// Local type definitions (moved from schema.ts for demo mode)
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

interface AnalysisReport {
  id: string;
  repositoryId: string;
  overallScore: number;
  issues: any[];
  recommendations: any[];
  createdAt: string;
  shareToken?: string;
}

interface RepositoryMetric {
  id: string;
  repositoryId: string;
  metricType: string;
  value: number;
  timestamp: string;
}

interface RepositoryState {
  repositories: Repository[];
  selectedRepository: Repository | null;
  analysisReports: AnalysisReport[];
  metrics: RepositoryMetric[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setRepositories: (repos: Repository[]) => void;
  addRepository: (repo: Repository) => void;
  selectRepository: (repo: Repository | null) => void;
  setAnalysisReports: (reports: AnalysisReport[]) => void;
  addAnalysisReport: (report: AnalysisReport) => void;
  setMetrics: (metrics: RepositoryMetric[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useRepositoryStore = create<RepositoryState>((set) => ({
  repositories: [],
  selectedRepository: null,
  analysisReports: [],
  metrics: [],
  isLoading: false,
  error: null,

  setRepositories: (repositories) => set({ repositories }),
  addRepository: (repository) =>
    set((state) => ({ repositories: [...state.repositories, repository] })),
  selectRepository: (selectedRepository) => set({ selectedRepository }),
  setAnalysisReports: (analysisReports) => set({ analysisReports }),
  addAnalysisReport: (report) =>
    set((state) => ({ analysisReports: [...state.analysisReports, report] })),
  setMetrics: (metrics) => set({ metrics }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
