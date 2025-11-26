-- Add primary_color to queue_settings table

ALTER TABLE queue_settings 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366F1';

-- Update RLS policy for queue_settings to include primary_color
DROP POLICY IF EXISTS "Users can update own settings" ON queue_settings;
CREATE POLICY "Users can update own settings"
    ON queue_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
