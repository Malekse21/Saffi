-- Add wifi_code column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wifi_code TEXT;

COMMENT ON COLUMN public.profiles.wifi_code IS 'WiFi password that patients can copy';
