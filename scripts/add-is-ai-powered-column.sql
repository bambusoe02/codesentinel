-- Add is_ai_powered column to analysis_reports table if it doesn't exist
-- This script is safe to run multiple times

DO $$ 
BEGIN
    -- Check if column exists, if not add it
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
END $$;

-- Verify the column exists and has correct constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'analysis_reports'
  AND column_name = 'is_ai_powered';

