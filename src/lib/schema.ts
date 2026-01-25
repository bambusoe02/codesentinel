import { pgTable, text, integer, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Type definitions for JSON fields
export interface AnalysisIssue {
  id: string;
  type: 'security' | 'performance' | 'maintainability' | 'reliability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  file?: string;
  line?: number;
  code?: string;
  impact?: string;
  fix?: string;
  effort?: 'low' | 'medium' | 'high';
  tags?: string[];
}

interface Recommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  priority: number;
  impact: string;
  effort?: string;
}

// Users table (linked to Clerk)
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(), // TEXT for Clerk IDs - must be provided by application
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  githubUsername: text('github_username'),
  githubToken: text('github_access_token'), // ✅ Fixed: matches database column name
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Repositories table
export const repositories = pgTable('repositories', {
  id: serial('id').primaryKey(), // ✅ SERIAL = auto-increment integer
                                    userId: text('user_id').references(() => users.id).notNull(),
                                    githubRepoId: integer('github_repo_id').unique().notNull(),
                                    name: text('name').notNull(),
                                    fullName: text('full_name').notNull(),
                                    description: text('description'),
                                    language: text('language'),
                                    stars: integer('stars').default(0),
                                    forks: integer('forks').default(0),
                                      isPrivate: integer('is_private').default(0),
                                    htmlUrl: text('html_url').notNull(),
                                    createdAt: timestamp('created_at').defaultNow().notNull(),
                                    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analysis reports table
export const analysisReports = pgTable('analysis_reports', {
  id: serial('id').primaryKey(), // ✅ SERIAL = auto-increment integer
                                       userId: text('user_id').references(() => users.id).notNull(),
                                       repositoryId: integer('repository_id').references(() => repositories.id).notNull(), // ✅ INTEGER
                                       analysisDate: timestamp('analysis_date').defaultNow(),
                                       overallScore: integer('overall_score').notNull(),
                                       securityScore: integer('security_score'),
                                       qualityScore: integer('quality_score'),
                                       performanceScore: integer('performance_score'),
                                       maintainabilityScore: integer('maintainability_score'),
                                       techDebtScore: integer('tech_debt_score'),
                                       reportData: jsonb('report_data').$type<AnalysisIssue[]>(), // ✅ report_data not issues
                                       recommendations: jsonb('recommendations').$type<Recommendation[]>(),
                                       shareToken: text('share_token'),
                                       isAiPowered: integer('is_ai_powered').notNull().default(0),
                                       createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Repository metrics table
export const repositoryMetrics = pgTable('repository_metrics', {
  id: serial('id').primaryKey(),
                                         repositoryId: integer('repository_id').references(() => repositories.id).notNull(),
                                         metricDate: timestamp('metric_date').notNull(),
                                         commitsCount: integer('commits_count').default(0),
                                         issuesCount: integer('issues_count').default(0),
                                         pullRequestsCount: integer('pull_requests_count').default(0),
                                         codeChurn: integer('code_churn').default(0),
                                         createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  repositories: many(repositories),
                                                              analysisReports: many(analysisReports),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  user: one(users, {
    fields: [repositories.userId],
    references: [users.id],
  }),
  analysisReports: many(analysisReports),
                                                                                 metrics: many(repositoryMetrics),
}));

export const analysisReportsRelations = relations(analysisReports, ({ one }) => ({
  user: one(users, {
    fields: [analysisReports.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [analysisReports.repositoryId],
    references: [repositories.id],
  }),
}));

export const repositoryMetricsRelations = relations(repositoryMetrics, ({ one }) => ({
  repository: one(repositories, {
    fields: [repositoryMetrics.repositoryId],
    references: [repositories.id],
  }),
}));
