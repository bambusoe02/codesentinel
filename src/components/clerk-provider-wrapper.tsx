'use client';

import dynamic from 'next/dynamic';

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
  isClerkAvailable: boolean;
}

export function ClerkProviderWrapper({ children, isClerkAvailable }: ClerkProviderWrapperProps) {
  // Only wrap with ClerkProvider if Clerk is available and configured
  if (isClerkAvailable) {
    // Use dynamic import to safely load Clerk only when needed
    const ClerkProviderComponent = dynamic(() =>
      import('@clerk/nextjs').then(mod => ({ default: mod.ClerkProvider })), {
        ssr: false, // Disable SSR for ClerkProvider
        loading: () => <>{children}</>
      }
    );

    return <ClerkProviderComponent>{children}</ClerkProviderComponent>;
  }

  return <>{children}</>;
}
