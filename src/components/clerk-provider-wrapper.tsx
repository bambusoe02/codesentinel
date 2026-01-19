'use client';

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
  isClerkAvailable: boolean;
}

export function ClerkProviderWrapper({ children, isClerkAvailable }: ClerkProviderWrapperProps) {
  // Only wrap with ClerkProvider if Clerk is available and configured
  if (isClerkAvailable) {
    try {
      const ClerkProvider = require('@clerk/nextjs').ClerkProvider;
      return <ClerkProvider>{children}</ClerkProvider>;
    } catch (error) {
      // Fallback if ClerkProvider fails to load
      console.warn('ClerkProvider failed to load:', error);
      return <>{children}</>;
    }
  }

  return <>{children}</>;
}
