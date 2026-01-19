'use client';

import { ClerkProvider } from '@clerk/nextjs';

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
  isClerkAvailable: boolean;
  publishableKey: string;
}

export function ClerkProviderWrapper({ children, isClerkAvailable, publishableKey }: ClerkProviderWrapperProps) {
  // Always render ClerkProvider if publishableKey exists (even if isClerkAvailable is false from server-side check)
  // This ensures client-side components can use Clerk hooks
  if (publishableKey && publishableKey.trim() !== '' && publishableKey !== 'pk_test_...') {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        {children}
      </ClerkProvider>
    );
  }

  return <>{children}</>;
}
