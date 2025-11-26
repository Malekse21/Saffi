-- Patient Feedback Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS patient_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_name TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patient_feedback_user_id ON patient_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_created_at ON patient_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_rating ON patient_feedback(rating);

-- Enable RLS
ALTER TABLE patient_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own feedback" ON patient_feedback;
CREATE POLICY "Users can view own feedback"
    ON patient_feedback FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert feedback" ON patient_feedback;
CREATE POLICY "Anyone can insert feedback"
    ON patient_feedback FOR INSERT
    WITH CHECK (true);
