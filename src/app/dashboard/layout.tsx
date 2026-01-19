import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

// Conditionally import Clerk auth
let auth: () => Promise<{ userId: string | null }> = async () => ({ userId: null });

try {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    const clerkAuth = await import('@clerk/nextjs/server');
    auth = clerkAuth.auth;
  }
} catch (error) {
  // Clerk not available, continue without authentication
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only check authentication if Clerk is configured
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    const { userId } = await auth();

    if (!userId) {
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
