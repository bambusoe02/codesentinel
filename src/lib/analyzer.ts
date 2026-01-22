import { GitHubFile, GitHubRepoStats, GitHubCommit } from './github';
import { AICodeAnalyzer } from './ai-analyzer';
import { logger } from './logger';

export interface AnalysisResult {
  overallScore: number;
  techDebtScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  issues: AnalysisIssue[];
  recommendations: Recommendation[];
  metrics: RepositoryMetrics;
  isAIPowered?: boolean; // Indicates if AI analysis was used
}

export interface AnalysisIssue {
  id: string;
  type: 'security' | 'performance' | 'maintainability' | 'reliability';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file?: string;
  line?: number;
  code?: string;
  impact: string;
  fix: string;
  effort: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface Recommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  priority: number;
  impact: string;
  effort: string;
}

export interface RepositoryMetrics {
  linesOfCode: number;
  filesCount: number;
  complexity: number;
  testCoverage: number;
  duplication: number;
  languageBreakdown: Record<string, number>;
  commitFrequency: number;
  contributorCount: number;
}

// AI-powered analyzer class
export class CodeAnalyzer {
  private repoName: string;
  private files: GitHubFile[];
  private stats: GitHubRepoStats;
  private commits: GitHubCommit[];

  constructor(repoName: string, files: GitHubFile[], stats: GitHubRepoStats, commits: GitHubCommit[]) {
    this.repoName = repoName;
    this.files = files;
    this.stats = stats;
    this.commits = commits;
  }

  async analyze(): Promise<AnalysisResult> {
    // Calculate metrics first (needed for both AI and rule-based)
    const metrics = this.calculateMetrics();

    // Check if AI is available
    const hasAPIKey = !!process.env.ANTHROPIC_API_KEY;
    const isAIAvailable = AICodeAnalyzer.isAvailable();
    
    logger.info('Analysis mode check', {
      hasAPIKey,
      isAIAvailable,
      apiKeyLength: hasAPIKey ? process.env.ANTHROPIC_API_KEY?.length : 0,
      apiKeyPrefix: hasAPIKey ? process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...' : 'none',
    });

    // Try AI-powered analysis first if available
    if (isAIAvailable && hasAPIKey) {
      try {
        logger.info('Attempting AI-powered analysis', { repoName: this.repoName });
        const aiAnalyzer = new AICodeAnalyzer(process.env.ANTHROPIC_API_KEY!);
        const repoContext = {
          name: this.repoName,
          language: this.stats.languages ? Object.keys(this.stats.languages)[0] : null,
          stars: 0, // Not available in stats
          contributors: this.stats.contributors,
          linesOfCode: this.stats.linesOfCode,
          filesCount: this.stats.filesCount,
        };

        const { result, isAIPowered } = await aiAnalyzer.analyzeCode(
          this.files,
          repoContext,
          metrics
        );

        logger.info('AI analysis completed successfully', { isAIPowered });
        return { ...result, isAIPowered };
      } catch (error) {
        logger.warn('AI analysis failed, falling back to rule-based analysis', { error });
        // Fall through to rule-based analysis
      }
    }

    // Fallback to rule-based analysis
    logger.info('Using rule-based analysis');
    const issues = await this.identifyIssues();
    const recommendations = this.generateRecommendations(issues);
    const scores = this.calculateScores(issues, metrics);

    return {
      overallScore: Math.round(scores.overall),
      techDebtScore: Math.round(scores.techDebt),
      securityScore: Math.round(scores.security),
      performanceScore: Math.round(scores.performance),
      maintainabilityScore: Math.round(scores.maintainability),
      issues,
      recommendations,
      metrics,
      isAIPowered: false,
    };
  }

  private async identifyIssues(): Promise<AnalysisIssue[]> {
    const issues: AnalysisIssue[] = [];

    // Analyze package.json for security and dependency issues
    const packageJson = this.files.find(f => f.name === 'package.json');
    if (packageJson?.content) {
      issues.push(...this.analyzePackageJson(packageJson));
    }

    // Analyze configuration files
    const configFiles = this.files.filter(f =>
      f.name.includes('config') ||
      f.name.includes('.env') ||
      f.name.includes('settings')
    );
    issues.push(...this.analyzeConfigFiles(configFiles));

    // Analyze source code files
    const sourceFiles = this.files.filter(f =>
      f.name.endsWith('.js') ||
      f.name.endsWith('.ts') ||
      f.name.endsWith('.jsx') ||
      f.name.endsWith('.tsx')
    );
    issues.push(...this.analyzeSourceFiles(sourceFiles));

    // Analyze for code quality issues
    issues.push(...this.analyzeCodeQuality());

    // Analyze commit patterns
    issues.push(...this.analyzeCommitPatterns());

    return issues;
  }

  private analyzePackageJson(packageFile: GitHubFile): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    try {
      const packageData = JSON.parse(packageFile.content!);

      // Check for outdated dependencies (simplified)
      if (packageData.dependencies) {
        const outdatedPackages = ['lodash', 'moment', 'request']; // Common outdated packages
        Object.keys(packageData.dependencies).forEach(dep => {
          if (outdatedPackages.some(outdated => dep.includes(outdated))) {
            issues.push({
              id: `dep-${dep}`,
              type: 'security',
              severity: 'medium',
              title: `Outdated dependency: ${dep}`,
              description: `${dep} has known security vulnerabilities or is deprecated`,
              file: packageFile.name,
              impact: 'Potential security risks and compatibility issues',
              fix: `Update ${dep} to the latest stable version or find a modern alternative`,
              effort: 'medium',
              tags: ['dependency', 'security', 'maintenance'],
            });
          }
        });
      }

      // Check for missing scripts
      const requiredScripts = ['test', 'build', 'lint'];
      const missingScripts = requiredScripts.filter(script => !packageData.scripts?.[script]);

      if (missingScripts.length > 0) {
        issues.push({
          id: 'missing-scripts',
          type: 'maintainability',
          severity: 'low',
          title: 'Missing standard npm scripts',
          description: `Missing scripts: ${missingScripts.join(', ')}`,
          file: packageFile.name,
          impact: 'Inconsistent development workflow',
          fix: 'Add the missing npm scripts to package.json',
          effort: 'low',
          tags: ['workflow', 'standards'],
        });
      }

    } catch {
      issues.push({
        id: 'invalid-package-json',
        type: 'reliability',
        severity: 'high',
        title: 'Invalid package.json',
        description: 'package.json contains invalid JSON syntax',
        file: packageFile.name,
        impact: 'Package installation and build failures',
        fix: 'Fix JSON syntax errors in package.json',
        effort: 'low',
        tags: ['configuration', 'syntax'],
      });
    }

    return issues;
  }

  private analyzeConfigFiles(configFiles: GitHubFile[]): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    configFiles.forEach(file => {
      if (file.content) {
        // Check for hardcoded secrets
        const secretPatterns = [
          /password\s*[:=]\s*['"]([^'"]+)['"]/gi,
          /secret\s*[:=]\s*['"]([^'"]+)['"]/gi,
          /token\s*[:=]\s*['"]([^'"]+)['"]/gi,
          /api[_-]?key\s*[:=]\s*['"]([^'"]+)['"]/gi,
        ];

        secretPatterns.forEach(pattern => {
          const matches = file.content!.match(pattern);
          if (matches) {
            issues.push({
              id: `secret-${file.name}-${Math.random()}`,
              type: 'security',
              severity: 'critical',
              title: 'Hardcoded secrets detected',
              description: 'Configuration file contains hardcoded sensitive information',
              file: file.name,
              impact: 'Severe security risk - credentials exposed in repository',
              fix: 'Move secrets to environment variables or secure credential storage',
              effort: 'high',
              tags: ['security', 'credentials', 'configuration'],
            });
          }
        });

        // Check for debug mode in production
        if (file.content.includes('debug: true') || file.content.includes('"debug": true')) {
          issues.push({
            id: `debug-${file.name}`,
            type: 'security',
            severity: 'medium',
            title: 'Debug mode enabled',
            description: 'Debug logging is enabled which may expose sensitive information',
            file: file.name,
            impact: 'Potential information disclosure in production',
            fix: 'Disable debug mode in production configuration',
            effort: 'low',
            tags: ['security', 'logging', 'production'],
          });
        }
      }
    });

    return issues;
  }

  private analyzeSourceFiles(sourceFiles: GitHubFile[]): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    sourceFiles.forEach(file => {
      if (file.content) {
        const content = file.content;

        // Check for console.log statements
        const consoleLogs = content.match(/console\.log/g);
        if (consoleLogs && consoleLogs.length > 5) {
          issues.push({
            id: `console-${file.name}`,
            type: 'maintainability',
            severity: 'low',
            title: 'Excessive console logging',
            description: `Found ${consoleLogs.length} console.log statements`,
            file: file.name,
            impact: 'Cluttered console output and potential performance impact',
            fix: 'Remove or replace console.log with proper logging framework',
            effort: 'medium',
            tags: ['logging', 'debug', 'performance'],
          });
        }

        // Check for TODO comments
        const todos = content.match(/\/\/\s*TODO|\/\*\s*TODO|\#\s*TODO/gi);
        if (todos) {
          issues.push({
            id: `todo-${file.name}`,
            type: 'maintainability',
            severity: 'low',
            title: 'TODO comments found',
            description: `Found ${todos.length} unresolved TODO comments`,
            file: file.name,
            impact: 'Incomplete features or technical debt',
            fix: 'Address or remove TODO comments',
            effort: 'medium',
            tags: ['todo', 'debt', 'incomplete'],
          });
        }

        // Check for large functions (simplified)
        const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g);
        if (functions && functions.length > 0 && content.length > 2000) {
          issues.push({
            id: `complex-${file.name}`,
            type: 'maintainability',
            severity: 'medium',
            title: 'Potentially complex file',
            description: 'File may contain overly complex functions or logic',
            file: file.name,
            impact: 'Difficult to maintain and test',
            fix: 'Consider breaking down into smaller, focused functions',
            effort: 'high',
            tags: ['complexity', 'maintainability', 'refactoring'],
          });
        }

        // Check for unused imports (simplified)
        const imports = content.match(/import\s+.*from\s+['"][^'"]+['"]/g);
        if (imports && imports.length > 10) {
          issues.push({
            id: `imports-${file.name}`,
            type: 'maintainability',
            severity: 'low',
            title: 'Many imports detected',
            description: `File has ${imports.length} import statements`,
            file: file.name,
            impact: 'Potential for unused imports and bundle bloat',
            fix: 'Review and remove unused imports',
            effort: 'low',
            tags: ['imports', 'bundle', 'optimization'],
          });
        }
      }
    });

    return issues;
  }

  private analyzeCodeQuality(): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Analyze based on repository statistics
    if (this.stats.linesOfCode > 50000) {
      issues.push({
        id: 'large-codebase',
        type: 'maintainability',
        severity: 'medium',
        title: 'Large codebase detected',
        description: `${this.stats.linesOfCode.toLocaleString()} lines of code may be difficult to maintain`,
        impact: 'Increased complexity and maintenance overhead',
        fix: 'Consider modularizing the codebase or breaking into microservices',
        effort: 'high',
        tags: ['size', 'complexity', 'architecture'],
      });
    }

    if (this.stats.filesCount > 1000) {
      issues.push({
        id: 'many-files',
        type: 'maintainability',
        severity: 'low',
        title: 'Large number of files',
        description: `${this.stats.filesCount} files detected`,
        impact: 'Navigation and organization challenges',
        fix: 'Implement better file organization and documentation',
        effort: 'medium',
        tags: ['organization', 'structure', 'navigation'],
      });
    }

    if (this.stats.contributors < 3) {
      issues.push({
        id: 'few-contributors',
        type: 'reliability',
        severity: 'medium',
        title: 'Limited contributor diversity',
        description: `Only ${this.stats.contributors} contributors`,
        impact: 'Single point of failure and knowledge silos',
        fix: 'Encourage more team members to contribute',
        effort: 'medium',
        tags: ['team', 'diversity', 'bus-factor'],
      });
    }

    return issues;
  }

  private analyzeCommitPatterns(): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    if (this.stats.commitFrequency < 5) {
      issues.push({
        id: 'low-commit-frequency',
        type: 'maintainability',
        severity: 'low',
        title: 'Low commit frequency',
        description: `Only ${this.stats.commitFrequency} commits per month`,
        impact: 'Slow development velocity and large changes',
        fix: 'Implement more frequent, smaller commits',
        effort: 'medium',
        tags: ['workflow', 'velocity', 'commits'],
      });
    }

    // Check for large commits (simplified)
    const largeCommits = this.commits.filter(commit =>
      commit.commit.message.toLowerCase().includes('merge') ||
      commit.commit.message.length > 100
    );

    if (largeCommits.length > this.commits.length * 0.3) {
      issues.push({
        id: 'large-commits',
        type: 'maintainability',
        severity: 'medium',
        title: 'Large merge commits detected',
        description: 'Many commits appear to be large merges',
        impact: 'Difficult code reviews and potential conflicts',
        fix: 'Use smaller, focused commits and regular rebasing',
        effort: 'medium',
        tags: ['commits', 'workflow', 'reviews'],
      });
    }

    return issues;
  }

  private generateRecommendations(issues: AnalysisIssue[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Group issues by type and severity
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const securityIssues = issues.filter(i => i.type === 'security');

    if (criticalIssues.length > 0) {
      recommendations.push({
        id: 'immediate-security',
        type: 'immediate',
        title: 'Address critical security issues immediately',
        description: `Fix ${criticalIssues.length} critical security vulnerabilities before deployment`,
        priority: 10,
        impact: 'Prevent security breaches and data loss',
        effort: 'high',
      });
    }

    if (securityIssues.length > 0) {
      recommendations.push({
        id: 'security-audit',
        type: 'short-term',
        title: 'Implement security audit process',
        description: 'Set up automated security scanning and regular security reviews',
        priority: 8,
        impact: 'Reduce security vulnerabilities over time',
        effort: 'medium',
      });
    }

    if (issues.filter(i => i.type === 'maintainability').length > 10) {
      recommendations.push({
        id: 'refactoring',
        type: 'short-term',
        title: 'Plan comprehensive refactoring',
        description: 'Address technical debt through systematic code improvements',
        priority: 6,
        impact: 'Improve code quality and developer productivity',
        effort: 'high',
      });
    }

    recommendations.push({
      id: 'testing',
      type: 'short-term',
      title: 'Improve test coverage',
      description: 'Add comprehensive unit and integration tests',
      priority: 7,
      impact: 'Reduce bugs and improve code reliability',
      effort: 'high',
    });

    recommendations.push({
      id: 'documentation',
      type: 'long-term',
      title: 'Enhance documentation',
      description: 'Create comprehensive README, API docs, and code documentation',
      priority: 4,
      impact: 'Improve onboarding and knowledge sharing',
      effort: 'medium',
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private calculateMetrics(): RepositoryMetrics {
    return {
      linesOfCode: this.stats.linesOfCode,
      filesCount: this.stats.filesCount,
      complexity: Math.min(100, Math.round(this.stats.linesOfCode / 500)), // Simplified
      testCoverage: 65, // Mock value
      duplication: Math.min(100, Math.round(this.stats.linesOfCode / 2000)), // Simplified
      languageBreakdown: this.stats.languages,
      commitFrequency: this.stats.commitFrequency,
      contributorCount: this.stats.contributors,
    };
  }

  private calculateScores(issues: AnalysisIssue[], metrics: RepositoryMetrics) {
    // Simplified scoring algorithm
    const baseScore = 100;

    // Security scoring
    const securityIssues = issues.filter(i => i.type === 'security');
    const securityPenalty = securityIssues.reduce((acc, issue) => {
      switch (issue.severity) {
        case 'critical': return acc + 20;
        case 'high': return acc + 10;
        case 'medium': return acc + 5;
        case 'low': return acc + 2;
        default: return acc + 1;
      }
    }, 0);
    const securityScore = Math.max(0, baseScore - securityPenalty);

    // Performance scoring
    const performanceIssues = issues.filter(i => i.type === 'performance');
    const performancePenalty = performanceIssues.length * 3;
    const performanceScore = Math.max(0, baseScore - performancePenalty);

    // Maintainability scoring
    const maintainabilityIssues = issues.filter(i => i.type === 'maintainability');
    const maintainabilityPenalty = maintainabilityIssues.length * 2 + metrics.complexity;
    const maintainabilityScore = Math.max(0, baseScore - maintainabilityPenalty);

    // Tech debt score (inverse of maintainability)
    const techDebtScore = 100 - maintainabilityScore;

    // Overall score
    const overallScore = Math.round(
      (securityScore * 0.4) +
      (performanceScore * 0.3) +
      (maintainabilityScore * 0.3)
    );

    return {
      overall: overallScore,
      security: securityScore,
      performance: performanceScore,
      maintainability: maintainabilityScore,
      techDebt: techDebtScore,
    };
  }
}

// Factory function for creating analyzers
export async function createAnalyzer(
  repoName: string,
  files: GitHubFile[],
  stats: GitHubRepoStats,
  commits: GitHubCommit[]
): Promise<CodeAnalyzer> {
  return new CodeAnalyzer(repoName, files, stats, commits);
}
