import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ScanHeader } from '@/components/scan/scan-header';
import { ScanProgress } from '@/components/scan/scan-progress';
import { ScanResults } from '@/components/scan/scan-results';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/error-boundary';
import { AnalysisPageSkeleton } from '@/components/skeletons/analysis-page-skeleton';
import { PDFExportProvider } from '@/contexts/pdf-export-context';

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic';

interface ScanPageProps {
  params: Promise<{
    repo: string;
  }>;
}

export default async function ScanPage({ params }: ScanPageProps) {
  const { repo } = await params;
  const repoName = decodeURIComponent(repo);

  // In a real app, you'd validate the repo exists and user has access
  if (!repoName || !repoName.includes('/')) {
    notFound();
  }

  return (
    <PDFExportProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ErrorBoundary>
          <Suspense fallback={<AnalysisPageSkeleton />}>
            <ScanPageContent repoName={repoName} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </PDFExportProvider>
  );
}

// Separate component for better Suspense boundary handling
async function ScanPageContent({ repoName }: { repoName: string }) {
  return (
    <>
      <ErrorBoundary>
        <ScanHeader repoName={repoName} />
      </ErrorBoundary>

      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <Suspense fallback={<ScanProgressSkeleton />}>
            <ScanProgress repoName={repoName} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<ScanResultsSkeleton />}>
            <ScanResults repoName={repoName} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}

function ScanProgressSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-2 w-full mb-4" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

function ScanResultsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center space-x-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
