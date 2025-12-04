-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    code TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 10 unique promo codes
INSERT INTO public.promo_codes (code) VALUES
    ('SAFFI2025'),
    ('WELCOME10'),
    ('DOCTOR50'),
    ('STARTNOW'),
    ('HEALTH25'),
    ('CLINIC100'),
    ('DIGITALDOC'),
    ('MEDTECH24'),
    ('FUTUREMED'),
    ('EHEALTH10')
ON CONFLICT (code) DO NOTHING;

-- Update handle_new_user function to validate promo code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  promo_code_input TEXT;
BEGIN
  promo_code_input := NEW.raw_user_meta_data->>'promo_code';

  -- Validate promo code if provided
  IF promo_code_input IS NOT NULL AND promo_code_input <> '' THEN
    IF EXISTS (SELECT 1 FROM public.promo_codes WHERE code = promo_code_input) THEN
      DELETE FROM public.promo_codes WHERE code = promo_code_input;
    ELSE
      RAISE EXCEPTION 'Code promo invalide';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, clinic_name, clinic_id, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'clinic_id')::uuid, gen_random_uuid()),
    'digital'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
