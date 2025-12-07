-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  motif TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Users can insert their own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Users can delete their own appointments"
  ON appointments FOR DELETE
  USING (auth.uid() = doctor_id);

-- Update patients table (serving as the Queue)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id);

-- Update status check constraint on patients table
-- We need to drop the old constraint and add a new one
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;
ALTER TABLE patients ADD CONSTRAINT patients_status_check 
  CHECK (status IN ('waiting', 'active', 'completed', 'away', 'scheduled'));

-- Add index for appointment_id
CREATE INDEX IF NOT EXISTS idx_patients_appointment_id ON patients(appointment_id);
