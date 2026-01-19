import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProviderWrapper } from "@/components/clerk-provider-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { PWAInstall } from "@/components/pwa-install";
import "./globals.css";

// Check if Clerk is available on server
let isClerkAvailable = false;
try {
  require('@clerk/nextjs');
  // Check both public and secret keys
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
  isClerkAvailable = hasPublishableKey && hasSecretKey;

  console.log('Clerk availability check:', {
    hasPublishableKey,
    hasSecretKey,
    isClerkAvailable,
    nodeEnv: process.env.NODE_ENV,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasGitHubToken: !!process.env.GITHUB_TOKEN
  });
} catch (error) {
  console.log('Clerk package not available:', error);
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
  title: "CodeSentinel - AI GitHub Repository Analyzer",
  description: "Professional AI-powered GitHub repository analysis for engineering managers. Analyze code quality, security risks, and performance issues.",
  keywords: ["GitHub", "code analysis", "AI", "repository analyzer", "tech debt", "security", "performance"],
  authors: [{ name: "CodeSentinel Team" }],
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
    title: "CodeSentinel - AI GitHub Repository Analyzer",
    description: "Professional AI-powered GitHub repository analysis for engineering managers",
    siteName: "CodeSentinel",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeSentinel - AI GitHub Repository Analyzer",
    description: "Professional AI-powered GitHub repository analysis for engineering managers",
    creator: "@codesentinel",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProviderWrapper isClerkAvailable={isClerkAvailable}>
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
            <Providers>
              {children}
              <Toaster />
              <PWAInstall />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
