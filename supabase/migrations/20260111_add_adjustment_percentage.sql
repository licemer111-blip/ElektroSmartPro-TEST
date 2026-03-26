-- Add adjustment_percentage column to projects table
-- This column stores the global price adjustment as a percentage (-20 to +20)

DO $$ 
BEGIN
  -- Add adjustment_percentage column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'adjustment_percentage'
  ) THEN
    ALTER TABLE projects 
    ADD COLUMN adjustment_percentage NUMERIC DEFAULT 0;
    
    RAISE NOTICE 'Added adjustment_percentage column to projects table';
  ELSE
    RAISE NOTICE 'adjustment_percentage column already exists';
  END IF;
END $$;

-- Add a check constraint to ensure adjustment is within reasonable bounds (-20% to +20%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_adjustment_percentage_check'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_adjustment_percentage_check
    CHECK (adjustment_percentage >= -20 AND adjustment_percentage <= 20);
    
    RAISE NOTICE 'Added check constraint for adjustment_percentage';
  ELSE
    RAISE NOTICE 'Check constraint already exists';
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN projects.adjustment_percentage IS 'Global price adjustment percentage for quick negotiations. Range: -20% (discount) to +20% (markup)';
