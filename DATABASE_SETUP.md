# Database Setup Guide for CodeSentinel

## Problem
Table "analysis_reports" does not exist in Neon database, causing 500 errors on all API calls.

## Solution Options

### Option 1: Use Drizzle Migrations (Recommended)

#### Step 1: Check Environment Variables
```bash
# Make sure DATABASE_URL is set in .env.local
echo $DATABASE_URL
```

#### Step 2: Generate and Push Migrations
```bash
npm run db:generate
npm run db:push
```

#### Step 3: Verify in Neon Dashboard
- Go to Neon Dashboard → SQL Editor
- Run: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`
- Should see: users, repositories, analysis_reports, repository_metrics

---

### Option 2: Manual SQL Setup (If migrations fail)

#### Step 1: Open Neon SQL Editor
1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor"

#### Step 2: Run Complete Schema
Copy and paste the entire content from `scripts/create-tables-manual.sql` into SQL Editor and execute.

**OR** run this complete script:

```sql
-- Complete Database Schema for CodeSentinel
-- Run this in Neon SQL Editor

-- 1. Users table
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

-- 2. Repositories table
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

-- 3. Analysis Reports table (CRITICAL - this is missing!)
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

-- 4. Repository Metrics table
CREATE TABLE IF NOT EXISTS "repository_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "repository_id" uuid NOT NULL,
  "metric_type" text NOT NULL,
  "value" integer NOT NULL,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "repository_metrics_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE no action ON UPDATE no action
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_analysis_reports_user_id" ON "analysis_reports"("user_id");
CREATE INDEX IF NOT EXISTS "idx_analysis_reports_repository_id" ON "analysis_reports"("repository_id");
CREATE INDEX IF NOT EXISTS "idx_analysis_reports_created_at" ON "analysis_reports"("created_at");
CREATE INDEX IF NOT EXISTS "idx_repositories_user_id" ON "repositories"("user_id");
CREATE INDEX IF NOT EXISTS "idx_repositories_full_name" ON "repositories"("full_name");
CREATE INDEX IF NOT EXISTS "idx_repository_metrics_repository_id" ON "repository_metrics"("repository_id");

-- 6. Verify tables were created
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'repositories', 'analysis_reports', 'repository_metrics')
GROUP BY table_name
ORDER BY table_name;
```

#### Step 3: Verify Setup
After running the SQL, verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'repositories', 'analysis_reports', 'repository_metrics');
```

Should return 4 rows.

---

### Option 3: Vercel Environment Variables

#### Check DATABASE_URL in Vercel:
1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Verify `DATABASE_URL` is set
4. If missing, add it from Neon Dashboard:
   - Neon Dashboard → Your Project → Connection Details
   - Copy connection string
   - Add to Vercel as `DATABASE_URL`

#### After adding DATABASE_URL:
1. Redeploy on Vercel
2. Or trigger migration via API (if you add migration endpoint)

---

## Verification Steps

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 2. Check analysis_reports Structure
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'analysis_reports'
ORDER BY ordinal_position;
```

Should see:
- id (uuid)
- user_id (uuid)
- repository_id (uuid)
- overall_score (integer)
- issues (jsonb)
- recommendations (jsonb)
- share_token (text)
- is_ai_powered (integer) ← CRITICAL - this was missing!
- created_at (timestamp)

### 3. Test API Endpoint
After setup, test:
```bash
curl https://codesentinel-six.vercel.app/api/test-ai
```

Should return 200 OK (not 500).

---

## Troubleshooting

### Error: "relation does not exist"
- Tables were not created
- Run manual SQL setup (Option 2)

### Error: "column does not exist"
- Migration incomplete
- Check if `is_ai_powered` column exists:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'analysis_reports' AND column_name = 'is_ai_powered';
  ```
- If missing, run:
  ```sql
  ALTER TABLE "analysis_reports" ADD COLUMN "is_ai_powered" integer DEFAULT 0 NOT NULL;
  ```

### Error: "permission denied"
- Check database user permissions
- Ensure user has CREATE TABLE permissions

---

## Quick Fix (If Everything Else Fails)

Run this single SQL command in Neon SQL Editor:

```sql
-- Quick fix: Create analysis_reports if missing
CREATE TABLE IF NOT EXISTS "analysis_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "repository_id" uuid NOT NULL,
  "overall_score" integer NOT NULL,
  "issues" jsonb,
  "recommendations" jsonb,
  "share_token" text,
  "is_ai_powered" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "analysis_reports" 
    ADD CONSTRAINT IF NOT EXISTS "analysis_reports_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'repositories') THEN
    ALTER TABLE "analysis_reports" 
    ADD CONSTRAINT IF NOT EXISTS "analysis_reports_repository_id_repositories_id_fk" 
    FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id");
  END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS "idx_analysis_reports_repository_id" ON "analysis_reports"("repository_id");
```

---

## After Setup

1. ✅ Verify tables exist
2. ✅ Test API endpoints
3. ✅ Redeploy on Vercel (if needed)
4. ✅ Run a test analysis

---

**Need Help?** Check Vercel logs for specific error messages.

