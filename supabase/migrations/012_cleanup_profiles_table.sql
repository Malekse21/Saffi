-- Clean up profiles table: remove unused columns and migrate data to full_name
-- This migration is safe to run multiple times

DO $$ 
BEGIN
    -- Ensure full_name column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Ensure clinic_name column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'clinic_name') THEN
        ALTER TABLE public.profiles ADD COLUMN clinic_name TEXT;
    END IF;
END $$;

-- Migrate data from first_name and last_name to full_name if not already done
UPDATE public.profiles
SET full_name = COALESCE(
    full_name,
    CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
        WHEN first_name IS NOT NULL THEN first_name
        WHEN last_name IS NOT NULL THEN last_name
        ELSE ''
    END
)
WHERE full_name IS NULL OR full_name = '';

-- Auto-generate clinic_name as "Cabinet Dr. [Full Name]"
UPDATE public.profiles
SET clinic_name = 'Cabinet Dr. ' || full_name
WHERE full_name IS NOT NULL AND full_name != '' AND (clinic_name IS NULL OR clinic_name = '');

-- Drop unused columns if they exist
DO $$ 
BEGIN
    -- Drop first_name if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE public.profiles DROP COLUMN first_name;
    END IF;
    
    -- Drop last_name if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE public.profiles DROP COLUMN last_name;
    END IF;
    
    -- Drop primary_color if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'primary_color') THEN
        ALTER TABLE public.profiles DROP COLUMN primary_color;
    END IF;
END $$;
