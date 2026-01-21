import { Suspense } from 'react';
import { RepositoryList } from '@/components/dashboard/repository-list';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { UserSync } from '@/components/dashboard/user-sync';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/error-boundary';

export const dynamic = 'force-dynamic';

// Disable static generation for dashboard
export const generateStaticParams = undefined;

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <UserSync />
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back!</h1>
          <p className="text-sm sm:text-base text-blue-100">
            Ready to analyze your repositories? Connect GitHub to get started with AI-powered code analysis.
          </p>
        </div>

        {/* Quick Actions */}
        <ErrorBoundary>
          <QuickActions />
        </ErrorBoundary>

        {/* Metrics Overview */}
        <ErrorBoundary>
          <Suspense fallback={<MetricsGridSkeleton />}>
            <MetricsGrid />
          </Suspense>
        </ErrorBoundary>

        {/* Repository List & Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div id="repositories" className="lg:col-span-2">
            <ErrorBoundary>
              <Suspense fallback={<RepositoryListSkeleton />}>
                <RepositoryList />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div className="hidden lg:block">
            <ErrorBoundary>
              <Suspense fallback={<RecentActivitySkeleton />}>
                <RecentActivity />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function MetricsGridSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function RepositoryListSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
