import Anthropic from '@anthropic-ai/sdk';
import { GitHubFile } from './github';
import { AnalysisResult, AnalysisIssue, Recommendation, RepositoryMetrics } from './analyzer';
import { logger } from './logger';

export interface RepoContext {
  name: string;
  language: string | null;
  stars: number;
  contributors: number;
  linesOfCode: number;
  filesCount: number;
}

interface AIAnalysisResponse {
  securityIssues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file?: string;
    line?: number;
    codeSnippet?: string;
    recommendation: string;
    impact: string;
  }>;
  performanceIssues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file?: string;
    line?: number;
    codeSnippet?: string;
    recommendation: string;
    impact: string;
  }>;
  qualityIssues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file?: string;
    line?: number;
    codeSnippet?: string;
    recommendation: string;
    impact: string;
  }>;
  architectureIssues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file?: string;
    line?: number;
    codeSnippet?: string;
    recommendation: string;
    impact: string;
  }>;
  overallAssessment: string;
  topRecommendations: string[];
}

export class AICodeAnalyzer {
  private client: Anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.apiKey = apiKey;
    this.client = new Anthropic({ apiKey });
  }

  async analyzeCode(
    files: GitHubFile[],
    repoContext: RepoContext,
    existingMetrics: RepositoryMetrics
  ): Promise<{ result: AnalysisResult; isAIPowered: boolean }> {
    try {
      // Prepare code samples
      const codeSnippets = this.prepareCodeSnippets(files);

      // Build analysis prompt
      const prompt = this.buildAnalysisPrompt(codeSnippets, repoContext);

      // Call Claude with code analysis prompt
      // Try claude-3-5-sonnet-20241022 first, fallback to claude-3-sonnet-20240229
      let message;
      try {
        message = await this.client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
      } catch (modelError: unknown) {
        // If model not found, try older version
        const error = modelError as { status?: number; message?: string; type?: string };
        if (error?.status === 400 || error?.message?.includes('model')) {
          logger.warn('Claude 3.5 Sonnet not available, trying Claude 3 Sonnet', { error });
          message = await this.client.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          });
        } else {
          logger.error('Claude API call failed', modelError, {
            errorMessage: error?.message,
            errorStatus: error?.status,
            errorType: error?.type,
          });
          throw modelError;
        }
      }

      // Extract text from response
      if (!message.content || message.content.length === 0) {
        throw new Error('Empty response from Claude API');
      }

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty text in Claude API response');
      }

      logger.info('Claude API response received', {
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
      });

      // Parse AI response into structured format
      const aiResult = this.parseAIResponse(responseText);

      // Convert to our AnalysisResult format
      const result = this.convertToAnalysisResult(aiResult, existingMetrics);

      return { result, isAIPowered: true };
    } catch (error) {
      logger.error('AI analysis failed, falling back to rule-based', error);
      throw error; // Let caller handle fallback
    }
  }

  private buildAnalysisPrompt(code: string, context: RepoContext): string {
    return `You are a senior software engineer reviewing this codebase.

Repository: ${context.name}
Language: ${context.language || 'Unknown'}
Stars: ${context.stars}
Contributors: ${context.contributors}
Lines of Code: ${context.linesOfCode.toLocaleString()}
Files: ${context.filesCount}

Code samples to analyze:
${code}

Analyze for:
1. SECURITY issues (hardcoded secrets, SQL injection risks, XSS vulnerabilities, insecure dependencies, authentication flaws, authorization issues)
2. PERFORMANCE issues (inefficient algorithms, memory leaks, N+1 queries, large bundle sizes, missing caching, blocking operations)
3. CODE QUALITY issues (code smells, duplication, complexity, lack of tests, poor naming, magic numbers, long functions)
4. ARCHITECTURE issues (tight coupling, missing error handling, poor separation of concerns, anti-patterns, technical debt)

Respond ONLY in valid JSON format (no markdown, no code blocks):
{
  "securityIssues": [{
    "severity": "high|medium|low",
    "title": "Issue title",
    "description": "Detailed description",
    "file": "path/to/file.ts",
    "line": 45,
    "codeSnippet": "problematic code",
    "recommendation": "How to fix",
    "impact": "What could happen"
  }],
  "performanceIssues": [...],
  "qualityIssues": [...],
  "architectureIssues": [...],
  "overallAssessment": "Brief summary",
  "topRecommendations": ["rec1", "rec2", "rec3"]
}

Be specific with file paths and line numbers where possible.
Prioritize real issues over nitpicks.
Focus on actionable, high-impact findings.`;
  }

  private prepareCodeSnippets(files: GitHubFile[]): string {
    // Select important files (max 15 files to fit in context)
    const importantFiles = this.selectImportantFiles(files);

    // Format for Claude with file paths
    return importantFiles
      .map((file) => {
        const content = file.content || '';
        // Limit content per file to ~2000 chars to fit in context
        const truncatedContent =
          content.length > 2000 ? content.substring(0, 2000) + '\n... (truncated)' : content;
        return `=== ${file.path} ===\n${truncatedContent}\n`;
      })
      .join('\n\n');
  }

  private selectImportantFiles(files: GitHubFile[]): GitHubFile[] {
    // Priority order:
    // 1. Main app files (index, app, main, server)
    // 2. Config files (package.json, tsconfig, .env, etc.)
    // 3. API/route files
    // 4. Component files (sample)
    // 5. Other source files

    const priorityPatterns = [
      { pattern: /^(index|main|app|server|entry)\.(ts|js|tsx|jsx)$/i, priority: 1 },
      { pattern: /(package\.json|tsconfig|\.env|config|settings)/i, priority: 2 },
      { pattern: /\/(api|routes?|endpoints?)\//i, priority: 3 },
      { pattern: /\/(components?|src|lib)\//i, priority: 4 },
      { pattern: /\.(ts|tsx|js|jsx)$/i, priority: 5 },
    ];

    const scoredFiles = files
      .filter((file) => file.type === 'file' && file.content)
      .map((file) => {
        let priority = 999;
        for (const { pattern, priority: p } of priorityPatterns) {
          if (pattern.test(file.path)) {
            priority = p;
            break;
          }
        }
        return { file, priority };
      })
      .sort((a, b) => a.priority - b.priority)
      .map((item) => item.file);

    // Limit to 15 files to fit in Claude's context
    return scoredFiles.slice(0, 15);
  }

  private parseAIResponse(response: string): AIAnalysisResponse {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    cleaned = cleaned.replace(/```json\n?/g, '');
    cleaned = cleaned.replace(/```\n?/g, '');
    cleaned = cleaned.replace(/^```/g, '');
    cleaned = cleaned.replace(/```$/g, '');
    cleaned = cleaned.trim();

    // Try to extract JSON if wrapped in text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(cleaned);

      // Validate structure - make arrays optional with defaults
      const result: AIAnalysisResponse = {
        securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [],
        performanceIssues: Array.isArray(parsed.performanceIssues) ? parsed.performanceIssues : [],
        qualityIssues: Array.isArray(parsed.qualityIssues) ? parsed.qualityIssues : [],
        architectureIssues: Array.isArray(parsed.architectureIssues) ? parsed.architectureIssues : [],
        overallAssessment: parsed.overallAssessment || 'Analysis completed',
        topRecommendations: Array.isArray(parsed.topRecommendations) ? parsed.topRecommendations : [],
      };

      logger.info('AI response parsed successfully', {
        securityIssues: result.securityIssues.length,
        performanceIssues: result.performanceIssues.length,
        qualityIssues: result.qualityIssues.length,
        architectureIssues: result.architectureIssues.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to parse AI response', error, {
        responseLength: cleaned.length,
        responsePreview: cleaned.substring(0, 1000),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Invalid AI response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertToAnalysisResult(
    aiResult: AIAnalysisResponse,
    metrics: RepositoryMetrics
  ): AnalysisResult {
    // Convert AI issues to our format
    const issues: AnalysisIssue[] = [];

    // Security issues
    aiResult.securityIssues?.forEach((issue, index) => {
      issues.push({
        id: `ai-security-${index}`,
        type: 'security',
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        file: issue.file,
        line: issue.line,
        code: issue.codeSnippet,
        impact: issue.impact,
        fix: issue.recommendation,
        effort: this.estimateEffort(issue.severity),
        tags: ['ai-detected', 'security'],
      });
    });

    // Performance issues
    aiResult.performanceIssues?.forEach((issue, index) => {
      issues.push({
        id: `ai-performance-${index}`,
        type: 'performance',
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        file: issue.file,
        line: issue.line,
        code: issue.codeSnippet,
        impact: issue.impact,
        fix: issue.recommendation,
        effort: this.estimateEffort(issue.severity),
        tags: ['ai-detected', 'performance'],
      });
    });

    // Quality issues (map to maintainability)
    aiResult.qualityIssues?.forEach((issue, index) => {
      issues.push({
        id: `ai-quality-${index}`,
        type: 'maintainability',
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        file: issue.file,
        line: issue.line,
        code: issue.codeSnippet,
        impact: issue.impact,
        fix: issue.recommendation,
        effort: this.estimateEffort(issue.severity),
        tags: ['ai-detected', 'code-quality'],
      });
    });

    // Architecture issues (map to maintainability)
    aiResult.architectureIssues?.forEach((issue, index) => {
      issues.push({
        id: `ai-architecture-${index}`,
        type: 'maintainability',
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        file: issue.file,
        line: issue.line,
        code: issue.codeSnippet,
        impact: issue.impact,
        fix: issue.recommendation,
        effort: this.estimateEffort(issue.severity),
        tags: ['ai-detected', 'architecture'],
      });
    });

    // Convert recommendations
    const recommendations: Recommendation[] = aiResult.topRecommendations?.map((rec, index) => ({
      id: `ai-rec-${index}`,
      type: index < 2 ? 'immediate' : index < 4 ? 'short-term' : 'long-term',
      title: rec,
      description: rec,
      priority: 10 - index,
      impact: 'Improve code quality and maintainability',
      effort: 'medium',
    })) || [];

    // Calculate scores
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
    };
  }

  private estimateEffort(severity: string): 'low' | 'medium' | 'high' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private calculateScores(issues: AnalysisIssue[], metrics: RepositoryMetrics) {
    const baseScore = 100;

    // Security scoring
    const securityIssues = issues.filter((i) => i.type === 'security');
    const securityPenalty = securityIssues.reduce((acc, issue) => {
      switch (issue.severity) {
        case 'critical':
          return acc + 20;
        case 'high':
          return acc + 10;
        case 'medium':
          return acc + 5;
        case 'low':
          return acc + 2;
        default:
          return acc + 1;
      }
    }, 0);
    const securityScore = Math.max(0, baseScore - securityPenalty);

    // Performance scoring
    const performanceIssues = issues.filter((i) => i.type === 'performance');
    const performancePenalty = performanceIssues.reduce((acc, issue) => {
      switch (issue.severity) {
        case 'critical':
          return acc + 15;
        case 'high':
          return acc + 8;
        case 'medium':
          return acc + 4;
        case 'low':
          return acc + 2;
        default:
          return acc + 1;
      }
    }, 0);
    const performanceScore = Math.max(0, baseScore - performancePenalty);

    // Maintainability scoring
    const maintainabilityIssues = issues.filter((i) => i.type === 'maintainability');
    const maintainabilityPenalty =
      maintainabilityIssues.reduce((acc, issue) => {
        switch (issue.severity) {
          case 'critical':
            return acc + 12;
          case 'high':
            return acc + 6;
          case 'medium':
            return acc + 3;
          case 'low':
            return acc + 1;
          default:
            return acc + 0.5;
        }
      }, 0) + metrics.complexity * 0.1;
    const maintainabilityScore = Math.max(0, baseScore - maintainabilityPenalty);

    // Tech debt score (inverse of maintainability)
    const techDebtScore = 100 - maintainabilityScore;

    // Overall score
    const overallScore =
      securityScore * 0.4 + performanceScore * 0.3 + maintainabilityScore * 0.3;

    return {
      overall: overallScore,
      security: securityScore,
      performance: performanceScore,
      maintainability: maintainabilityScore,
      techDebt: techDebtScore,
    };
  }

  /**
   * Check if AI analyzer is available (API key configured)
   */
  static isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }
}

