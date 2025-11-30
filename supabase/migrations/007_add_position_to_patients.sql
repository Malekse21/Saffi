-- Add position column to patients table for persistent ordering
ALTER TABLE patients ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_patients_position ON patients(position);

-- Update existing records to have a default position based on created_at
WITH ordered_patients AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as new_pos
  FROM patients
  WHERE status = 'waiting'
)
UPDATE patients
SET position = ordered_patients.new_pos
FROM ordered_patients
WHERE patients.id = ordered_patients.id;
