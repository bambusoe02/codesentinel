'use client';

import { ClerkProvider } from '@clerk/nextjs';

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
  publishableKey: string;
}

export function ClerkProviderWrapper({ children, publishableKey }: ClerkProviderWrapperProps) {
  // Always render ClerkProvider if publishableKey exists
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
