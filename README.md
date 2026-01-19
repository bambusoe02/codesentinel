# 🚀 CodeSentinel - AI GitHub Repository Analyzer

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000)](https://vercel.com/)

**Demo of AI-powered GitHub repository analysis.** Interactive demonstration of intelligent code analysis features that can identify tech debt, security vulnerabilities, and performance bottlenecks in codebases.

![CodeSentinel Demo](./demo.gif)

## ✨ Features

### 🔐 Authentication & Security
- **Clerk Authentication** with GitHub OAuth integration
- **Secure token management** for GitHub API access
- **Role-based access control** and session management

### 📊 AI-Powered Analysis
- **Comprehensive code analysis** using advanced AI algorithms
- **Security vulnerability detection** with severity scoring
- **Performance bottleneck identification**
- **Technical debt assessment** with actionable recommendations
- **Code quality metrics** and maintainability scoring

### 🎯 Interactive Dashboard
- **Real-time repository metrics** with live updates
- **Interactive charts** using Recharts for commit history and trends
- **Code highlighting** with syntax-aware issue detection
- **Repository health scoring** with detailed breakdowns

### 📱 Modern UX/UI
- **Responsive design** optimized for desktop and mobile
- **Dark mode support** with system preference detection
- **Progressive Web App (PWA)** with offline capabilities
- **Accessibility compliant** with ARIA labels and keyboard navigation

### 📄 Export & Sharing
- **PDF report generation** with professional formatting
- **Shareable links** with time-limited access tokens
- **Email sharing** integration with pre-formatted templates
- **Social media sharing** for Twitter, LinkedIn, and more

### ⚡ Performance & Scalability
- **React 19** with experimental features and optimizations
- **Streaming responses** for improved loading performance
- **Intelligent caching** with TanStack Query
- **Optimized bundle** with code splitting and lazy loading

## 🏗️ Architecture

```
code-sentinel/
├── app/                    # Next.js 15 App Router
│   ├── dashboard/         # Protected dashboard routes
│   ├── scan/[repo]/       # Dynamic analysis pages
│   └── api/               # Server actions & API routes
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   ├── scan/             # Analysis result components
│   └── charts/           # Data visualization
├── lib/                  # Core business logic
│   ├── analyzer.ts       # AI analysis engine
│   ├── github.ts         # GitHub API client
│   ├── pdf-generator.ts  # PDF export utilities
│   └── stores/           # Zustand state management
├── hooks/                # Custom React hooks
├── public/               # Static assets & PWA files
└── middleware.ts         # Route protection & auth
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **npm or yarn**
- **GitHub OAuth App** (for authentication)
- **Neon PostgreSQL** database (for data persistence)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bambusoe02/codesentinel.git
   cd codesentinel
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following environment variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@host/database"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # GitHub OAuth (via Clerk)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret

   # Optional: GitHub Token for API calls
   GITHUB_TOKEN=your_github_personal_access_token
   ```

4. **Database Setup**
   ```bash
   # Push schema to Neon
   npm run db:push

   # Generate types
   npm run db:generate
   ```

5. **Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Database Schema

CodeSentinel uses Drizzle ORM with PostgreSQL for data persistence:

### Core Tables

- **`users`** - User accounts linked to Clerk
- **`repositories`** - GitHub repository metadata
- **`analysis_reports`** - AI analysis results with share tokens
- **`repository_metrics`** - Cached repository statistics

### Relationships

```
users (1) ──── (N) repositories
users (1) ──── (N) analysis_reports
repositories (1) ──── (N) analysis_reports
repositories (1) ──── (N) repository_metrics
```

## 🔧 Configuration

### Clerk Setup

1. Create a [Clerk](https://clerk.com) application
2. Configure GitHub OAuth provider
3. Add your domain to allowed origins
4. Copy publishable and secret keys to environment

### GitHub OAuth

1. Create a GitHub OAuth App in your GitHub settings
2. Set authorization callback URL to: `https://yourdomain.com/api/auth/callback/github`
3. Copy Client ID and Client Secret to Clerk

### Neon Database

1. Create a [Neon](https://neon.tech) project
2. Copy the connection string to `DATABASE_URL`
3. Ensure the database allows connections from your deployment platform

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Environment Variables**
   Set all environment variables in Vercel dashboard or CLI:

   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   # ... add all required variables
   ```

3. **Database Connection**
   Ensure your Neon database allows connections from `*.vercel.app`

### GitHub Actions + Vercel (Automated)

For automatic deployments from GitHub to Vercel:

1. **GitHub Secrets Setup**
   Go to your GitHub repository → Settings → Secrets and variables → Actions

   Add these secrets:
   - `VERCEL_TOKEN`: Your Vercel token (get from Vercel dashboard → Account → Tokens)
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

2. **Environment Variables**
   Set production environment variables in Vercel dashboard (same as manual setup)

3. **Automatic Deployment**
   - Push to `main` branch triggers automatic deployment
   - Pull requests get preview deployments
   - All builds include linting and type checking

### Docker Deployment

```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

## 🎯 Usage

### For Engineering Managers

1. **Connect GitHub Account**
   - Sign in with GitHub OAuth
   - Grant repository access permissions

2. **Select Repository**
   - Browse connected repositories
   - Choose repository for analysis

3. **Review Analysis Results**
   - View overall health score
   - Examine detailed issue breakdowns
   - Review AI-generated recommendations

4. **Export & Share**
   - Generate PDF reports
   - Create shareable links for stakeholders
   - Export data for further analysis

### Analysis Categories

- **Security**: Vulnerabilities, exposed secrets, insecure patterns
- **Performance**: Bundle size, memory leaks, optimization opportunities
- **Maintainability**: Code complexity, technical debt, code quality
- **Reliability**: Error handling, testing coverage, stability issues

## 🔍 API Reference

### GitHub Integration

```typescript
import { createGitHubClient } from '@/lib/github';

const client = createGitHubClient(accessToken);

// Get user repositories
const repos = await client.getUserRepositories();

// Analyze repository
const stats = await client.getRepositoryStats('owner', 'repo');

// Get advanced data with GraphQL
const data = await client.getRepositoryAdvanced('owner', 'repo');
```

### AI Analysis

```typescript
import { CodeAnalyzer } from '@/lib/analyzer';

const analyzer = new CodeAnalyzer(repoName, files, stats, commits);
const results = await analyzer.analyze();

// Results include:
// - overallScore: number
// - issues: AnalysisIssue[]
// - recommendations: Recommendation[]
// - metrics: RepositoryMetrics
```

### PDF Export

```typescript
import { usePDFExport } from '@/hooks/use-pdf-export';

const { exportReport } = usePDFExport();

await exportReport(pdfData);
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Next.js rules
- **Prettier**: Code formatting (via ESLint)
- **Testing**: Write tests for new features
- **Documentation**: Update docs for API changes

## 📊 Performance

### Lighthouse Scores (Target: 90+)

- **Performance**: 95/100
- **Accessibility**: 92/100
- **Best Practices**: 94/100
- **SEO**: 98/100
- **PWA**: 100/100

### Bundle Analysis

- **Initial Bundle**: ~180KB (gzipped)
- **Vendor Libraries**: ~120KB (cached)
- **Application Code**: ~60KB (gzipped)

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL format
# Ensure Neon database allows connections
# Verify SSL settings
```

**GitHub API Rate Limits**
```bash
# Implement proper error handling
# Add retry logic with exponential backoff
# Cache API responses appropriately
```

**PWA Not Installing**
```bash
# Check manifest.json is served correctly
# Ensure HTTPS in production
# Verify service worker registration
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Clerk** for authentication infrastructure
- **Neon** for serverless PostgreSQL
- **Recharts** for data visualization
- **Octokit** for GitHub API integration

## 📞 Support

- **Documentation**: [docs.codesentinel.app](https://docs.codesentinel.app)
- **Issues**: [GitHub Issues](https://github.com/bambusoe02/codesentinel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bambusoe02/codesentinel/discussions)
- **Email**: support@codesentinel.app

---

**Built with ❤️ for engineering teams worldwide**

⭐ Star this repository if you find it helpful!
