'use client';

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  // Check if Clerk is properly configured
  const hasClerkConfig = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY;

  // Only wrap with ClerkProvider if properly configured
  if (hasClerkConfig) {
    // Dynamic import to avoid build issues when Clerk is not available
    const ClerkProvider = require('@clerk/nextjs').ClerkProvider;
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  return <>{children}</>;
}
