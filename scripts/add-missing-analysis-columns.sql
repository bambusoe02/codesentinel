-- Add missing columns to analysis_reports table
-- This script is safe to run multiple times (idempotent)

DO $$ 
BEGIN
    -- Add security_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' 
        AND column_name = 'security_score'
    ) THEN
        ALTER TABLE analysis_reports 
        ADD COLUMN security_score INTEGER;
        RAISE NOTICE 'Column security_score added successfully';
    ELSE
        RAISE NOTICE 'Column security_score already exists';
    END IF;

    -- Add performance_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' 
        AND column_name = 'performance_score'
    ) THEN
        ALTER TABLE analysis_reports 
        ADD COLUMN performance_score INTEGER;
        RAISE NOTICE 'Column performance_score added successfully';
    ELSE
        RAISE NOTICE 'Column performance_score already exists';
    END IF;

    -- Add maintainability_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' 
        AND column_name = 'maintainability_score'
    ) THEN
        ALTER TABLE analysis_reports 
        ADD COLUMN maintainability_score INTEGER;
        RAISE NOTICE 'Column maintainability_score added successfully';
    ELSE
        RAISE NOTICE 'Column maintainability_score already exists';
    END IF;

    -- Add tech_debt_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' 
        AND column_name = 'tech_debt_score'
    ) THEN
        ALTER TABLE analysis_reports 
        ADD COLUMN tech_debt_score INTEGER;
        RAISE NOTICE 'Column tech_debt_score added successfully';
    ELSE
        RAISE NOTICE 'Column tech_debt_score already exists';
    END IF;

    -- Ensure is_ai_powered exists (should already exist, but check anyway)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' 
        AND column_name = 'is_ai_powered'
    ) THEN
        ALTER TABLE analysis_reports 
        ADD COLUMN is_ai_powered INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Column is_ai_powered added successfully';
    ELSE
        RAISE NOTICE 'Column is_ai_powered already exists';
    END IF;

    -- Ensure recommendations column exists and has default
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analysis_reports' 
        AND column_name = 'recommendations'
    ) THEN
        ALTER TABLE analysis_reports 
        ADD COLUMN recommendations JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Column recommendations added successfully';
    ELSE
        -- Update existing column to have default if it doesn't
        ALTER TABLE analysis_reports 
        ALTER COLUMN recommendations SET DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Column recommendations already exists, default updated';
    END IF;
END $$;

-- Verify all columns exist
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

