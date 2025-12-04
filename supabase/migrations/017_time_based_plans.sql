-- Add subscription columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sms_allocation TIMESTAMPTZ;

-- Function to extend subscription
CREATE OR REPLACE FUNCTION public.extend_subscription(user_id UUID, plan_type TEXT)
RETURNS VOID AS $$
DECLARE
  days_to_add INTEGER;
BEGIN
  -- Determine days to add based on plan type
  CASE plan_type
    WHEN 'monthly' THEN days_to_add := 30;
    WHEN 'trimestrial' THEN days_to_add := 90;
    WHEN 'yearly' THEN days_to_add := 365;
    ELSE RAISE EXCEPTION 'Invalid plan type: %', plan_type;
  END CASE;

  -- Update profile
  UPDATE public.profiles
  SET 
    plan = plan_type,
    subscription_end_date = GREATEST(NOW(), COALESCE(subscription_end_date, NOW())) + (days_to_add || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and allocate SMS
CREATE OR REPLACE FUNCTION public.check_and_allocate_sms()
RETURNS VOID AS $$
BEGIN
  -- Update profiles where subscription is active AND (last allocation was null OR > 1 month ago)
  UPDATE public.profiles
  SET 
    sms_balance = sms_balance + 250,
    last_sms_allocation = NOW()
  WHERE 
    subscription_end_date > NOW() 
    AND (last_sms_allocation IS NULL OR last_sms_allocation < NOW() - INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user to set initial trial
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
    last_sms_allocation
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'clinic_id')::uuid, gen_random_uuid()),
    'trial',
    NOW() + INTERVAL '14 days', -- 14 days free trial
    NOW() -- Initialize allocation time
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
