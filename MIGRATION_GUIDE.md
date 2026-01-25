# Database Migration Guide - Analysis Reports Schema Fix

## Problem
The `analysis_reports` table was missing several columns that are used by the application:
- `security_score` (INTEGER)
- `performance_score` (INTEGER)
- `maintainability_score` (INTEGER)
- `tech_debt_score` (INTEGER)
- `is_ai_powered` (INTEGER, should already exist)
- `recommendations` (JSONB, should already exist but may need default)

## Solution

### Step 1: Run SQL Migration

**In Neon SQL Editor**, run the migration script:

```sql
-- File: scripts/add-missing-analysis-columns.sql
-- This script is idempotent (safe to run multiple times)
```

Or run directly:

```sql
DO $$ 
BEGIN
    -- Add security_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' AND column_name = 'security_score'
    ) THEN
        ALTER TABLE analysis_reports ADD COLUMN security_score INTEGER;
    END IF;

    -- Add performance_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' AND column_name = 'performance_score'
    ) THEN
        ALTER TABLE analysis_reports ADD COLUMN performance_score INTEGER;
    END IF;

    -- Add maintainability_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' AND column_name = 'maintainability_score'
    ) THEN
        ALTER TABLE analysis_reports ADD COLUMN maintainability_score INTEGER;
    END IF;

    -- Add tech_debt_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' AND column_name = 'tech_debt_score'
    ) THEN
        ALTER TABLE analysis_reports ADD COLUMN tech_debt_score INTEGER;
    END IF;

    -- Ensure is_ai_powered exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' AND column_name = 'is_ai_powered'
    ) THEN
        ALTER TABLE analysis_reports ADD COLUMN is_ai_powered INTEGER DEFAULT 0 NOT NULL;
    END IF;

    -- Ensure recommendations has default
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' AND column_name = 'recommendations'
    ) THEN
        ALTER TABLE analysis_reports ADD COLUMN recommendations JSONB DEFAULT '[]'::jsonb;
    ELSE
        ALTER TABLE analysis_reports ALTER COLUMN recommendations SET DEFAULT '[]'::jsonb;
    END IF;
END $$;
```

### Step 2: Verify Migration

Check that all columns exist:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'analysis_reports'
  AND column_name IN (
    'security_score',
    'performance_score', 
    'maintainability_score',
    'tech_debt_score',
    'is_ai_powered',
    'recommendations'
  )
ORDER BY column_name;
```

### Step 3: Code Changes (Already Applied)

The following files have been updated:

1. **`src/lib/schema.ts`**
   - Added `securityScore`, `performanceScore`, `maintainabilityScore`, `techDebtScore` columns

2. **`src/app/api/repositories/[repo]/analyze/route.ts`**
   - Updated insert to save all score fields
   - Improved error handling with fallback logic

3. **`src/app/api/repositories/[repo]/history/route.ts`**
   - Updated to use database columns if available, fallback to calculated values

4. **`src/app/api/repositories/[repo]/results/route.ts`**
   - Already handles missing columns gracefully

### Step 4: Test

After migration:

1. **Test Analysis:**
   ```bash
   POST /api/repositories/owner/repo/analyze
   ```

2. **Verify Database:**
   ```sql
   SELECT 
     id, 
     overall_score, 
     security_score, 
     performance_score, 
     maintainability_score,
     is_ai_powered,
     created_at
   FROM analysis_reports 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Test Results:**
   ```bash
   GET /api/repositories/owner/repo/results
   ```

4. **Test History:**
   ```bash
   GET /api/repositories/owner/repo/history
   ```

## Notes

- The migration script is **idempotent** - safe to run multiple times
- Existing records will have `NULL` for new score columns (this is expected)
- New analyses will populate all score fields
- The application handles missing columns gracefully with fallback logic

## Troubleshooting

### Error: "column does not exist"
- Make sure you ran the SQL migration script
- Check that you're connected to the correct database
- Verify column names match exactly (case-sensitive in PostgreSQL)

### Error: "Both insert attempts failed"
- Check database connection
- Verify all required columns exist
- Check database logs for detailed error messages

### Scores are NULL in old records
- This is expected - old records were created before these columns existed
- New analyses will have all scores populated
- History endpoint calculates scores from issues if database columns are NULL

