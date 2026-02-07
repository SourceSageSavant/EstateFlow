-- Geofencing Migration
-- Adds location columns to properties table for entry verification

-- Add latitude column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE properties ADD COLUMN latitude DOUBLE PRECISION;
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE properties ADD COLUMN longitude DOUBLE PRECISION;
    END IF;

    -- Add geofence_radius column if it doesn't exist (default 100 meters)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'geofence_radius'
    ) THEN
        ALTER TABLE properties ADD COLUMN geofence_radius INTEGER DEFAULT 100;
    END IF;
END $$;
