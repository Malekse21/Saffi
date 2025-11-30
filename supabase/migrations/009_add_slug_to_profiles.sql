-- Add slug column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);

-- Update trigger to generate slug for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  random_suffix TEXT;
BEGIN
  -- Generate base slug from full_name (doctor's name)
  base_slug := LOWER(REGEXP_REPLACE(
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'doctor'),
    '[^a-z0-9]+', '-', 'g'
  ));
  
  -- Remove leading/trailing hyphens
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Generate random 4-digit suffix
  random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Combine to create unique slug (e.g., "dr-malek-8492")
  final_slug := base_slug || '-' || random_suffix;
  
  -- Insert profile with all data
  INSERT INTO public.profiles (id, email, full_name, clinic_name, clinic_id, slug, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'clinic_id')::uuid, gen_random_uuid()),
    final_slug,
    'digital'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
