-- Add motif column with default value
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS motif text DEFAULT 'consultation';

-- Add is_priority column with default value
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS is_priority boolean DEFAULT false;
