-- Fix for monthly_awards table RLS policies
-- Run this in your Supabase SQL Editor to fix the "row-level security policy" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view monthly awards" ON monthly_awards;
DROP POLICY IF EXISTS "Authenticated users can insert awards" ON monthly_awards;
DROP POLICY IF EXISTS "Authenticated users can update awards" ON monthly_awards;

-- Create new policies that allow public access
-- (Since this is a ping pong leaderboard app, public access is appropriate)

-- Allow anyone to read awards
CREATE POLICY "Public can view monthly awards"
  ON monthly_awards FOR SELECT
  USING (true);

-- Allow anyone to insert awards (for automatic saving)
CREATE POLICY "Public can insert awards"
  ON monthly_awards FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update awards (for upserts)
CREATE POLICY "Public can update awards"
  ON monthly_awards FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verify policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'monthly_awards';

