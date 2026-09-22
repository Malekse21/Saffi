-- Add specialty column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS specialty text DEFAULT 'generaliste';
