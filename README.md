# 🚀 CodeSentinel - AI GitHub Repository Analyzer

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000)](https://vercel.com/)

**Production-ready AI-powered GitHub repository analysis platform.** Enterprise-grade intelligent code analysis that identifies tech debt, security vulnerabilities, and performance bottlenecks in codebases.

![CodeSentinel](./demo.gif)

## ✨ Features

### 🔐 Authentication & Security
- **Clerk Authentication** with GitHub OAuth integration
- **Automatic token synchronization** - GitHub tokens synced automatically from OAuth
- **Bank-level encryption** - AES-256-GCM encryption for secure token storage
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
├── app/                    # Next.js 16 App Router
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
│   ├── encryption.ts     # Token encryption utilities
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

   # Encryption (required for secure token storage)
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   # Generate with: openssl rand -base64 32

   # Optional: Fallback GitHub Token for API calls
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
  - `githubToken` - Encrypted GitHub OAuth token (AES-256-GCM)
  - `githubUsername` - Automatically synced from Clerk OAuth
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

**⚠️ IMPORTANT: Create database tables before deploying to production!**

After setting up Neon, you **must** run database migrations:

```bash
# Option 1: Push schema directly (recommended for quick setup)
npm run db:push

# Option 2: Generate and apply migrations (recommended for production)
npm run db:generate
# Then apply migrations via Neon SQL Editor or CLI
```

**For Production (Vercel):**
1. Set `DATABASE_URL` in Vercel environment variables
2. Run `npm run db:push` locally with production `DATABASE_URL`, OR
3. Use Neon SQL Editor to run the generated migration SQL manually
4. Verify tables exist: Check in Neon Dashboard → Tables

### Encryption Setup

**Required for secure token storage:**

1. Generate encryption key:
   ```bash
   openssl rand -base64 32
   ```

2. Add to environment variables:
   ```env
   ENCRYPTION_KEY=your_generated_key_here
   ```

3. **Important:** This key is required for:
   - Encrypting GitHub tokens before database storage
   - Decrypting tokens when making API calls
   - Ensuring data security at rest

   **⚠️ Never commit this key to version control!**

## 🚀 Deployment

### ⚡ Quick Production Setup

**Automated setup (recommended):**
```bash
# 1. Generate environment template
npm run setup:env

# 2. Fill in your values in .env.local
#    - Add DATABASE_URL (from Neon)
#    - Add Clerk keys (from Clerk Dashboard - PRODUCTION!)
#    - Generate and add ENCRYPTION_KEY:
npm run generate:encryption-key

# 3. Run production setup (pushes schema to database)
npm run setup:production

# 4. Add all environment variables to Vercel Dashboard
# 5. Redeploy on Vercel
```

**Manual setup:**
See detailed instructions below.

---

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
   vercel env add CLERK_SECRET_KEY
   vercel env add ENCRYPTION_KEY
   # ... add all required variables
   ```

   **Required variables for production:**
   - `DATABASE_URL` - Neon PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (PRODUCTION key, not development!)
   - `CLERK_SECRET_KEY` - Clerk secret key (PRODUCTION key)
   - `ENCRYPTION_KEY` - Generate with `npm run generate:encryption-key` or `openssl rand -base64 32`

   **📖 Detailed production setup guide:** See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)

3. **Database Connection & Schema**
   - Ensure your Neon database allows connections from `*.vercel.app`
   - **CRITICAL: Create database tables before deploying!**
   
      **Option A: Automated setup script (recommended)**
   ```bash
   # The script will guide you through the process
   npm run setup:production
   
   # Or manually:
   export DATABASE_URL="your_production_neon_connection_string"
   npm run db:push
   ```
   
   **Quick setup with helper scripts:**
   ```bash
   # Generate .env.local template
   npm run setup:env
   
   # Generate encryption key
   npm run generate:encryption-key
   
   # Run production setup (interactive)
   npm run setup:production
   ```
   
   **Option B: Use Neon SQL Editor**
   1. Go to Neon Dashboard → SQL Editor
   2. Copy contents of `schema.sql` (if available) or
   3. Use Drizzle Studio to generate SQL: `npm run db:studio`
   4. Run the generated SQL in Neon SQL Editor
   
   **Verify tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   
   You should see: `users`, `repositories`, `analysis_reports`, `repository_metrics`

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

1. **Sign In & Setup**
   - Sign in with GitHub OAuth via Clerk
   - Your GitHub token and username are automatically synchronized and securely encrypted
   - No manual token setup required! (Optional: manual token can be added in Settings as fallback)

2. **Select Repository**
   - Browse your repositories (automatically fetched from GitHub)
   - Choose repository for analysis

3. **Review Analysis Results**
   - View overall health score
   - Examine detailed issue breakdowns
   - Review AI-generated recommendations

4. **Export & Share**
   - Generate PDF reports
   - Create shareable links for stakeholders
   - Export data for further analysis

### GitHub Token Setup

**Automatic (Recommended):**
- Token is automatically synchronized from GitHub OAuth when you sign in via Clerk
- Token is securely encrypted using AES-256-GCM before storing in the database
- No manual setup required!

**Manual (Fallback):**
If automatic synchronization fails, you can manually add a GitHub Personal Access Token:

1. Go to **Settings** page in dashboard
2. Click **Generate new token** at [GitHub Settings](https://github.com/settings/tokens?type=beta)
3. Required scopes: `repo` (full control of private repositories), `read:user`
4. Copy and paste the token in Settings
5. Token will be encrypted and stored securely

**Security:** All tokens are encrypted using AES-256-GCM encryption before storage. Make sure to set `ENCRYPTION_KEY` environment variable (generate with `openssl rand -base64 32`).

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

**Encryption Key Not Set**
```bash
# Generate encryption key: openssl rand -base64 32
# Add ENCRYPTION_KEY to environment variables
# Required for secure token storage
```

**Token Not Synchronizing from Clerk**
```bash
# Ensure GitHub OAuth is configured in Clerk Dashboard
# Check that OAuth scopes include 'repo' and 'read:user'
# Users may need to re-authenticate to grant new permissions
```

**PWA Not Installing**
```bash
# Check manifest.json is served correctly
# Ensure HTTPS in production
# Verify service worker registration
```

**Database Tables Don't Exist (relation "users" does not exist)**
```bash
# This error means database schema was not created
# CRITICAL: You must create tables before using the app!

# Solution 1: Push schema directly (quickest)
export DATABASE_URL="your_production_neon_connection_string"
npm run db:push

# Solution 2: Use Neon SQL Editor
# Go to Neon Dashboard → SQL Editor
# Run the SQL from generated migrations or use Drizzle Studio

# Verify tables exist:
# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
# Should show: users, repositories, analysis_reports, repository_metrics
```

**404 Errors on API Routes / Repositories Not Loading**
```bash
# Check:
# 1. ✅ Database tables exist (see above - most common issue!)
# 2. ✅ Environment variables set in Vercel (DATABASE_URL, CLERK keys, ENCRYPTION_KEY)
# 3. ✅ Clerk Production keys used (not development keys)
# 4. ✅ User exists in database (check by calling /api/user/sync)
# 5. ✅ GitHub token synced (check Settings page)
```

**Clerk Development Keys Warning**
```bash
# Console shows: "Clerk has been loaded with development keys"
# Solution: Use Production keys in Vercel environment variables
# Go to Clerk Dashboard → Switch to Production → Copy new keys
# Update in Vercel: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Clerk** for authentication infrastructure and OAuth token management
- **Neon** for serverless PostgreSQL
- **Recharts** for data visualization
- **Octokit** for GitHub API integration

## 📞 Support

- **Email**: support@codesentinel.app

---

**Built with ❤️ for engineering teams worldwide**

⭐ Star this repository if you find it helpful!
