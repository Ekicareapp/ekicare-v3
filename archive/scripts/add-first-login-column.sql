-- Add first_login_completed column to pro_profiles table
-- This column will track if the professional has completed the onboarding process

DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pro_profiles' 
        AND column_name = 'first_login_completed'
    ) THEN
        -- Add the column
        ALTER TABLE public.pro_profiles
        ADD COLUMN first_login_completed BOOLEAN DEFAULT FALSE;
        
        -- Add a comment to explain the column
        COMMENT ON COLUMN public.pro_profiles.first_login_completed IS 'Tracks if the professional has completed the first-time onboarding process';
        
        RAISE NOTICE 'Column first_login_completed added to pro_profiles table successfully.';
    ELSE
        RAISE NOTICE 'Column first_login_completed already exists in pro_profiles table.';
    END IF;
END
$$;
