import { create } from 'zustand';
import { Repository, AnalysisReport, RepositoryMetric } from '@/lib/schema';

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

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
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
