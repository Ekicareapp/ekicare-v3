-- Add beta-related columns to pro_profiles
-- Safe to run multiple times due to IF NOT EXISTS guards

ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS beta_access BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS beta_start_date TIMESTAMP WITH TIME ZONE;

-- Ensure is_active exists (already added in previous migration, but safe-guard)
ALTER TABLE pro_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;


