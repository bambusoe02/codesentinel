import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

// Check if Clerk is available
let isClerkAvailable = false;
let auth: () => Promise<{ userId: string | null }> = async () => ({ userId: null });

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@clerk/nextjs/server');
  isClerkAvailable = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  if (isClerkAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const clerkAuth = require('@clerk/nextjs/server');
    auth = clerkAuth.auth;
  }
} catch {
  // Clerk not available, continue without authentication
  isClerkAvailable = false;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only check authentication if Clerk is available and configured
  if (isClerkAvailable) {
    const { userId } = await auth();

    if (!userId) {
      redirect('/');
    }

    // Sync user with database (use relative URL for client-side fetch)
    // Note: This will be handled client-side in a useEffect hook
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader isClerkAvailable={isClerkAvailable} />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
