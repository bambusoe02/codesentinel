import { create } from 'zustand';

interface UIState {
  // Modal states
  isConnectGitHubModalOpen: boolean;
  isAnalysisModalOpen: boolean;
  isShareModalOpen: boolean;

  // Drawer states
  isSettingsDrawerOpen: boolean;

  // Loading states
  isScanning: boolean;
  scanningProgress: number;
  scanningMessage: string;

  // Search states
  searchQuery: string;
  searchResults: Array<{
    id: string;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    owner: {
      login: string;
      avatar_url: string;
    };
  }>;

  // Actions
  setConnectGitHubModal: (open: boolean) => void;
  setAnalysisModal: (open: boolean) => void;
  setShareModal: (open: boolean) => void;
  setSettingsDrawer: (open: boolean) => void;
  setScanning: (scanning: boolean) => void;
  setScanningProgress: (progress: number) => void;
  setScanningMessage: (message: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Array<{
    id: string;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    owner: {
      login: string;
      avatar_url: string;
    };
  }>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isConnectGitHubModalOpen: false,
  isAnalysisModalOpen: false,
  isShareModalOpen: false,
  isSettingsDrawerOpen: false,
  isScanning: false,
  scanningProgress: 0,
  scanningMessage: '',
  searchQuery: '',
  searchResults: [],

  setConnectGitHubModal: (isConnectGitHubModalOpen) => set({ isConnectGitHubModalOpen }),
  setAnalysisModal: (isAnalysisModalOpen) => set({ isAnalysisModalOpen }),
  setShareModal: (isShareModalOpen) => set({ isShareModalOpen }),
  setSettingsDrawer: (isSettingsDrawerOpen) => set({ isSettingsDrawerOpen }),
  setScanning: (isScanning) => set({ isScanning }),
  setScanningProgress: (scanningProgress) => set({ scanningProgress }),
  setScanningMessage: (scanningMessage) => set({ scanningMessage }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
}));
