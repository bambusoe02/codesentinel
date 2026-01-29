import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProviderWrapper } from "@/components/clerk-provider-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { PWAInstall } from "@/components/pwa-install";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

// Initialize environment validation on server startup (safely)
// Wrapped in try-catch to prevent breaking app if validation fails
if (typeof window === 'undefined') {
  try {
    // Dynamic import to avoid breaking if module doesn't exist
    import('@/lib/env-validation').then(({ initEnvValidation }) => {
      if (typeof initEnvValidation === 'function') {
        initEnvValidation();
      }
    }).catch(() => {
      // Silently fail - validation is non-critical for app startup
    });
  } catch (error) {
    // Silently fail - validation is non-critical for app startup
    // Errors are logged internally by the validation function
  }
}

// Check if Clerk is available on server
let isClerkAvailable = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@clerk/nextjs');
  // Check both public and secret keys
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
  isClerkAvailable = hasPublishableKey && hasSecretKey;

  // Only log in development using logger
  if (process.env.NODE_ENV === 'development') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { logger } = require('@/lib/logger');
      logger.info('Clerk availability check', {
        hasPublishableKey,
        hasSecretKey,
        isClerkAvailable,
        nodeEnv: process.env.NODE_ENV,
        publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGitHubToken: !!process.env.GITHUB_TOKEN
      });
    } catch {
      // Logger not available, skip
    }
  }
} catch {
  isClerkAvailable = false;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'CodeSentinel - AI GitHub Analyzer',
  description: 'Enterprise-grade repo analysis platform',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CodeSentinel",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codesentinel-six.vercel.app",
    title: "CodeSentinel - AI GitHub Analyzer",
    description: "Enterprise-grade repo analysis platform",
    siteName: "CodeSentinel",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeSentinel - AI GitHub Analyzer",
    description: "Enterprise-grade repo analysis platform",
    creator: "@codesentinel",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  
  return (
    <ClerkProviderWrapper 
      publishableKey={publishableKey}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <Providers>
                {children}
                <Toaster />
                <PWAInstall />
              </Providers>
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
