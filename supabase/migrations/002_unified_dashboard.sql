-- Safe Migration: Unified Dashboard Schema
-- This migration adds columns to existing tables and creates new ones if needed
-- It will not fail if tables/columns already exist

-- 1. Update profiles table (tenants/doctors)
-- Add plan column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'plan'
    ) THEN
        ALTER TABLE profiles ADD COLUMN plan TEXT DEFAULT 'digital';
    END IF;
END $$;

-- Add check constraint for plan if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_plan_check'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check 
        CHECK (plan IN ('digital', 'connect'));
    END IF;
END $$;

-- Add sms_balance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'sms_balance'
    ) THEN
        ALTER TABLE profiles ADD COLUMN sms_balance INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add subscription_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 2. Create or update queue table (patients)
CREATE TABLE IF NOT EXISTS queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'away', 'completed')),
    type TEXT DEFAULT 'walk-in' CHECK (type IN ('walk-in', 'rdv')),
    appointment_time TIMESTAMP,
    is_priority BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing queue table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'queue' AND column_name = 'status'
    ) THEN
        ALTER TABLE queue ADD COLUMN status TEXT DEFAULT 'waiting';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'queue' AND column_name = 'type'
    ) THEN
        ALTER TABLE queue ADD COLUMN type TEXT DEFAULT 'walk-in';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'queue' AND column_name = 'appointment_time'
    ) THEN
        ALTER TABLE queue ADD COLUMN appointment_time TIMESTAMP;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'queue' AND column_name = 'is_priority'
    ) THEN
        ALTER TABLE queue ADD COLUMN is_priority BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add constraints for new queue columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'queue_status_check'
    ) THEN
        ALTER TABLE queue ADD CONSTRAINT queue_status_check 
        CHECK (status IN ('waiting', 'serving', 'away', 'completed'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'queue_type_check'
    ) THEN
        ALTER TABLE queue ADD CONSTRAINT queue_type_check 
        CHECK (type IN ('walk-in', 'rdv'));
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_clinic_id ON queue(clinic_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_type ON queue(type);
CREATE INDEX IF NOT EXISTS idx_queue_created_at ON queue(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_queue_updated_at'
    ) THEN
        CREATE TRIGGER update_queue_updated_at
        BEFORE UPDATE ON queue
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
