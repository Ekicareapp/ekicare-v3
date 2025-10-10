-- Add first_login_completed column to pro_profiles table
-- This tracks if the professional has seen the onboarding popup

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pro_profiles' 
        AND column_name = 'first_login_completed'
    ) THEN
        ALTER TABLE public.pro_profiles
        ADD COLUMN first_login_completed BOOLEAN DEFAULT FALSE;
        
        COMMENT ON COLUMN public.pro_profiles.first_login_completed IS 'Tracks if the professional has completed the first-time onboarding process';
        
        RAISE NOTICE 'Column first_login_completed added to pro_profiles table successfully.';
    ELSE
        RAISE NOTICE 'Column first_login_completed already exists in pro_profiles table.';
    END IF;
END
$$;

