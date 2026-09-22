-- Add lunch break start and end times to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS lunch_start_time text DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS lunch_end_time text DEFAULT '14:00';
