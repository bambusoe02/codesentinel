import { pgTable, text, integer, timestamp, jsonb, uuid, boolean, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (linked to Clerk)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name'),
  avatar: text('avatar'),
  githubToken: text('github_token'), // Encrypted
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// GitHub Repositories
export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  githubId: integer('github_id').unique().notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  owner: text('owner').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  language: text('language'),
  stars: integer('stars').default(0),
  forks: integer('forks').default(0),
  issues: integer('issues').default(0),
  isPrivate: boolean('is_private').default(false),
  lastScannedAt: timestamp('last_scanned_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analysis Reports
export const analysisReports = pgTable('analysis_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, processing, completed, failed
  techDebtScore: integer('tech_debt_score'),
  securityScore: integer('security_score'),
  performanceScore: integer('performance_score'),
  overallScore: integer('overall_score'),
  reportData: jsonb('report_data'), // Store the full AI analysis
  shareToken: text('share_token').unique(), // For public sharing
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Repository Metrics (cached data)
export const repositoryMetrics = pgTable('repository_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  linesOfCode: integer('lines_of_code'),
  filesCount: integer('files_count'),
  complexity: integer('complexity'),
  testCoverage: integer('test_coverage'),
  commitFrequency: integer('commit_frequency'),
  contributorCount: integer('contributor_count'),
  lastCommitDate: timestamp('last_commit_date'),
  languageBreakdown: jsonb('language_breakdown'),
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
  repository: one(repositories, {
    fields: [analysisReports.repositoryId],
    references: [repositories.id],
  }),
  user: one(users, {
    fields: [analysisReports.userId],
    references: [users.id],
  }),
}));

export const repositoryMetricsRelations = relations(repositoryMetrics, ({ one }) => ({
  repository: one(repositories, {
    fields: [repositoryMetrics.repositoryId],
    references: [repositories.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;

export type AnalysisReport = typeof analysisReports.$inferSelect;
export type NewAnalysisReport = typeof analysisReports.$inferInsert;

export type RepositoryMetric = typeof repositoryMetrics.$inferSelect;
export type NewRepositoryMetric = typeof repositoryMetrics.$inferInsert;
