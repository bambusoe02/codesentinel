import { pgTable, text, integer, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Type definitions for JSON fields
interface AnalysisIssue {
  id: string;
  type: 'security' | 'performance' | 'maintainability' | 'reliability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
}

interface Recommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  priority: number;
  impact: string;
}

// Users table (linked to Clerk)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  githubUsername: text('github_username'),
  githubToken: text('github_token'), // Encrypted/secure storage recommended
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Repositories table
export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  description: text('description'),
  htmlUrl: text('html_url').notNull(),
  owner: jsonb('owner').notNull(),
  stargazersCount: integer('stargazers_count').default(0),
  language: text('language'),
  topics: jsonb('topics').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analysis reports table
export const analysisReports = pgTable('analysis_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  overallScore: integer('overall_score').notNull(),
  issues: jsonb('issues').$type<AnalysisIssue[]>(),
  recommendations: jsonb('recommendations').$type<Recommendation[]>(),
  shareToken: text('share_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Repository metrics table
export const repositoryMetrics = pgTable('repository_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  metricType: text('metric_type').notNull(),
  value: integer('value').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
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
