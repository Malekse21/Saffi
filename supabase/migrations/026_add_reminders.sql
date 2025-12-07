-- Add reminder_sent column to appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Index for performance on the cron job query
CREATE INDEX IF NOT EXISTS idx_appointments_start_time_reminder 
ON appointments(start_time, reminder_sent);
