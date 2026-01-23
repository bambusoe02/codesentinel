-- Manual Database Setup for CodeSentinel
-- Run this in Neon SQL Editor if migrations don't work
-- Make sure to run in order (users first, then repositories, then analysis_reports)

-- 1. Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clerk_id" text NOT NULL UNIQUE,
  "email" text NOT NULL,
  "first_name" text,
  "last_name" text,
  "github_username" text,
  "github_token" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Create repositories table
CREATE TABLE IF NOT EXISTS "repositories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "full_name" text NOT NULL,
  "description" text,
  "html_url" text NOT NULL,
  "owner" jsonb NOT NULL,
  "stargazers_count" integer DEFAULT 0,
  "language" text,
  "topics" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "repositories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action
);

-- 3. Create analysis_reports table
CREATE TABLE IF NOT EXISTS "analysis_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "repository_id" uuid NOT NULL,
  "overall_score" integer NOT NULL,
  "issues" jsonb,
  "recommendations" jsonb,
  "share_token" text,
  "is_ai_powered" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "analysis_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "analysis_reports_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action
);

-- 4. Create repository_metrics table
CREATE TABLE IF NOT EXISTS "repository_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "repository_id" uuid NOT NULL,
  "metric_type" text NOT NULL,
  "value" integer NOT NULL,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "repository_metrics_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_analysis_reports_user_id" ON "analysis_reports"("user_id");
CREATE INDEX IF NOT EXISTS "idx_analysis_reports_repository_id" ON "analysis_reports"("repository_id");
CREATE INDEX IF NOT EXISTS "idx_analysis_reports_created_at" ON "analysis_reports"("created_at");
CREATE INDEX IF NOT EXISTS "idx_repositories_user_id" ON "repositories"("user_id");
CREATE INDEX IF NOT EXISTS "idx_repositories_full_name" ON "repositories"("full_name");
CREATE INDEX IF NOT EXISTS "idx_repository_metrics_repository_id" ON "repository_metrics"("repository_id");

-- 6. Verify tables were created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'repositories', 'analysis_reports', 'repository_metrics')
ORDER BY table_name, ordinal_position;

