-- Drop the check constraint on plan column
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Optionally add a new constraint if needed, or leave it open
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('digital', 'connect', 'trial', 'monthly', 'trimestrial', 'yearly'));
