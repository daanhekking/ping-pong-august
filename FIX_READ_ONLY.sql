-- Simple fix: Allow anyone to READ monthly awards
-- Run this in your Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE monthly_awards ENABLE ROW LEVEL SECURITY;

-- Drop any existing SELECT policy
DROP POLICY IF EXISTS "Anyone can view monthly awards" ON monthly_awards;
DROP POLICY IF EXISTS "Public can view monthly awards" ON monthly_awards;

-- Create a simple policy to allow reading awards
CREATE POLICY "Enable read access for all users"
  ON monthly_awards
  FOR SELECT
  USING (true);

-- Verify it works
SELECT COUNT(*) as total_awards FROM monthly_awards;

