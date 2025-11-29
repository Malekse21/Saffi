-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('digital', 'connect')),
ADD COLUMN IF NOT EXISTS clinic_id UUID,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Set default values for existing users (those who already have profiles)
-- Assume existing users have completed onboarding and are on the 'connect' plan
UPDATE public.profiles
SET 
    onboarding_completed = COALESCE(onboarding_completed, true),
    plan = COALESCE(plan, 'connect')
WHERE id IS NOT NULL;

-- Create index on clinic_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);
