-- Function to increment SMS balance
CREATE OR REPLACE FUNCTION public.increment_sms_balance(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET sms_balance = COALESCE(sms_balance, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
