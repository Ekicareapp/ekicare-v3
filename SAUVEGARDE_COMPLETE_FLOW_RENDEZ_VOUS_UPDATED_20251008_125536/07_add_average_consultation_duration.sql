-- Add average_consultation_duration column to pro_profiles table
-- Stores the average consultation duration in minutes

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'pro_profiles'
          AND column_name = 'average_consultation_duration'
    ) THEN
        ALTER TABLE public.pro_profiles
        ADD COLUMN average_consultation_duration INTEGER;

        COMMENT ON COLUMN public.pro_profiles.average_consultation_duration IS 'Average consultation duration in minutes';

        RAISE NOTICE 'Column average_consultation_duration added to pro_profiles table successfully.';
    ELSE
        RAISE NOTICE 'Column average_consultation_duration already exists in pro_profiles table.';
    END IF;
END
$$;


