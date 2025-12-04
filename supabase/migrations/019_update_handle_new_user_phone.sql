-- Update handle_new_user to save phone number
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

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    clinic_name, 
    clinic_id, 
    plan,
    subscription_end_date,
    last_sms_allocation,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'clinic_id')::uuid, gen_random_uuid()),
    'trial',
    NOW() + INTERVAL '14 days', -- 14 days free trial
    NOW(), -- Initialize allocation time
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '') -- Save phone number
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
