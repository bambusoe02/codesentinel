import Link from "next/link";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Conditionally load Clerk components
const SignedIn = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.SignedIn })))
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

const SignedOut = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.SignedOut })))
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

const SignInButton = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.SignInButton })))
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Code,
  Zap,
  Github,
  BarChart3,
  FileText,
  Share2
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CodeSentinel
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            🚀 AI-Powered Code Analysis Demo
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            AI-Powered GitHub
            <br />
            Repository Analysis
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your engineering management with intelligent code analysis.
            Identify tech debt, security vulnerabilities, and performance bottlenecks
            before they impact your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Free Analysis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </SignedIn>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Analyze Code Quality
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From real-time metrics to actionable insights, CodeSentinel gives you
            the complete picture of your repository health.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Security Analysis</CardTitle>
              <CardDescription>
                Detect security vulnerabilities, exposed secrets, and potential attack vectors
                in your codebase with AI-powered analysis.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Tech Debt Scoring</CardTitle>
              <CardDescription>
                Get quantitative tech debt scores with detailed breakdowns of code quality
                issues, complexity metrics, and maintenance costs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                Identify performance bottlenecks, memory leaks, and optimization
                opportunities with comprehensive code analysis.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Repository Metrics</CardTitle>
              <CardDescription>
                Track lines of code, contributor activity, language distribution,
                and commit frequency with interactive dashboards.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>PDF Reports</CardTitle>
              <CardDescription>
                Generate professional PDF reports with actionable recommendations,
                code examples, and priority-ranked fixes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <CardTitle>Shareable Links</CardTitle>
              <CardDescription>
                Share analysis results with stakeholders via secure, time-limited links
                without exposing your repository data.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-900 dark:bg-black py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Demo Features</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Explore the capabilities of AI-powered code analysis with our interactive demo.
              See how CodeSentinel can help analyze and improve your codebase quality.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-semibold mb-2">Security Analysis</div>
              <div className="text-slate-400 text-sm">Detect vulnerabilities and security issues</div>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-semibold mb-2">Code Quality</div>
              <div className="text-slate-400 text-sm">Analyze maintainability and complexity</div>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-semibold mb-2">Interactive Reports</div>
              <div className="text-slate-400 text-sm">Visual dashboards and insights</div>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-semibold mb-2">PDF Export</div>
              <div className="text-slate-400 text-sm">Generate professional reports</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Code Quality?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join leading engineering teams who trust CodeSentinel to maintain
            high-quality, secure, and performant codebases.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Your First Analysis
                  <Github className="ml-2 w-5 h-5" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Interactive demo with sample data. Try the analysis features.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">CodeSentinel</span>
            <span className="text-slate-500">© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
