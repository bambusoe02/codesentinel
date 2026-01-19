import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProviderWrapper } from "@/components/clerk-provider-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { PWAInstall } from "@/components/pwa-install";
import "./globals.css";

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
  viewport: "width=device-width, initial-scale=1",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CodeSentinel",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codesentinel.app",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProviderWrapper>
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
              <SpeedInsights />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProviderWrapper>
  );
}
