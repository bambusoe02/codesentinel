ALTER TABLE "analysis_reports" ADD COLUMN "is_ai_powered" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_token" text;