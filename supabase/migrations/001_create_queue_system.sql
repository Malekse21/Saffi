-- Saffi Database Migration: Dynamic Queue System
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create patients table
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'completed', 'away')),
  type TEXT NOT NULL CHECK (type IN ('walk-in', 'rdv')),
  arrival_time TIMESTAMPTZ DEFAULT NOW(),
  rdv_time TIMESTAMPTZ,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- ============================================
-- 2. Create queue_settings table
-- ============================================
CREATE TABLE IF NOT EXISTS queue_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  last_ticket_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create RLS Policies for patients table
-- ============================================

-- Allow users to view their own patients
CREATE POLICY "Users can view their own patients"
  ON patients FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own patients
CREATE POLICY "Users can insert their own patients"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own patients
CREATE POLICY "Users can update their own patients"
  ON patients FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own patients
CREATE POLICY "Users can delete their own patients"
  ON patients FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Create RLS Policies for queue_settings table
-- ============================================

-- Allow users to manage their own settings
CREATE POLICY "Users can view their own queue settings"
  ON queue_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue settings"
  ON queue_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue settings"
  ON queue_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. Create function to auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_settings_updated_at
    BEFORE UPDATE ON queue_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Enable Realtime (for live updates)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE patients;

-- ============================================
-- Migration Complete!
-- ============================================
-- Your database is now ready for the dynamic queue system.
-- New users will start with an empty dashboard.
-- All patient data will be stored and synced in real-time.
