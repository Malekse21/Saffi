-- Updated Settings Table Schema for Saffi Dashboard
-- Run these queries in your Supabase SQL Editor

-- Drop old columns if they exist
ALTER TABLE queue_settings 
DROP COLUMN IF EXISTS away_limit_enabled,
DROP COLUMN IF EXISTS tv_privacy_mode,
DROP COLUMN IF EXISTS google_calendar_reminders,
DROP COLUMN IF EXISTS reminder_timing_hours;

-- Add new columns for General & Schedule
ALTER TABLE queue_settings 
ADD COLUMN IF NOT EXISTS clinic_display_name TEXT DEFAULT 'Cabinet Médical',
ADD COLUMN IF NOT EXISTS avg_consultation_duration INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS opening_time TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS auto_close_queue BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS closed_queue_message TEXT DEFAULT 'Le cabinet ne prend plus de patients aujourd''hui. Revenez demain à 08h00.',
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366F1';

-- Add new columns for Queue Algorithm
ALTER TABLE queue_settings 
ADD COLUMN IF NOT EXISTS delay_mode_minutes INTEGER DEFAULT 0;

-- Add new columns for TV & Announcements
ALTER TABLE queue_settings 
ADD COLUMN IF NOT EXISTS announcement_style TEXT DEFAULT 'number_only' CHECK (announcement_style IN ('number_only', 'number_name', 'silence')),
ADD COLUMN IF NOT EXISTS announcement_language TEXT DEFAULT 'fr' CHECK (announcement_language IN ('fr', 'ar')),
ADD COLUMN IF NOT EXISTS announcement_volume INTEGER DEFAULT 80 CHECK (announcement_volume >= 0 AND announcement_volume <= 100);

-- Add new columns for Billing
ALTER TABLE queue_settings 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'digital' CHECK (subscription_plan IN ('digital', 'connect')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired'));

-- Keep existing SMS balance column
ALTER TABLE queue_settings 
ADD COLUMN IF NOT EXISTS sms_balance INTEGER DEFAULT 0;

-- Add updated_at if doesn't exist
ALTER TABLE queue_settings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create invoices table for payment history
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TND',
    description TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed')),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(invoice_number)
);

-- Create index for faster invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices"
    ON invoices FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices"
    ON invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_queue_settings_updated_at ON queue_settings;
CREATE TRIGGER update_queue_settings_updated_at
    BEFORE UPDATE ON queue_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for queue_settings (ensure they exist)
ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON queue_settings;
CREATE POLICY "Users can view own settings"
    ON queue_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON queue_settings;
CREATE POLICY "Users can update own settings"
    ON queue_settings FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON queue_settings;
CREATE POLICY "Users can insert own settings"
    ON queue_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_queue_settings_user_id ON queue_settings(user_id);

-- Example: Insert sample invoice data (optional, for testing)
-- INSERT INTO invoices (user_id, invoice_number, amount, description, payment_method, status, pdf_url)
-- VALUES (
--   'USER_ID_HERE',
--   'INV-2025-001',
--   35.00,
--   'Recharge SMS - 1000 crédits',
--   'Konnect',
--   'paid',
--   'https://example.com/invoices/INV-2025-001.pdf'
-- );
