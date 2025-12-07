-- Add whatsapp column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

COMMENT ON COLUMN public.profiles.whatsapp IS 'WhatsApp number for contact';
