-- Add consultation_duration column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS consultation_duration INTEGER DEFAULT 20;

-- Comment on column
COMMENT ON COLUMN public.profiles.consultation_duration IS 'Average consultation duration in minutes';
