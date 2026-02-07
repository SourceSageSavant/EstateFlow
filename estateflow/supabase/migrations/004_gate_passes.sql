-- Gate Passes Migration v2
-- Adds enhanced columns to existing gate_passes table and updates RLS policies

-- Add missing columns to existing gate_passes table
-- (Uses DO block to check if columns exist before adding)

DO $$
BEGIN
    -- Add property_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'property_id'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE CASCADE;
    END IF;

    -- Add visitor_phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'visitor_phone'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN visitor_phone TEXT;
    END IF;

    -- Add visitor_id_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'visitor_id_number'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN visitor_id_number TEXT;
    END IF;

    -- Add visitor_vehicle column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'visitor_vehicle'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN visitor_vehicle TEXT;
    END IF;

    -- Add purpose column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'purpose'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN purpose TEXT;
    END IF;

    -- Add qr_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'qr_data'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN qr_data TEXT;
    END IF;

    -- Add checked_in_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'checked_in_at'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN checked_in_at TIMESTAMPTZ;
    END IF;

    -- Add checked_out_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'checked_out_at'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN checked_out_at TIMESTAMPTZ;
    END IF;

    -- Add checked_in_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'checked_in_by'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN checked_in_by UUID REFERENCES profiles(id);
    END IF;

    -- Add checked_out_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'checked_out_by'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN checked_out_by UUID REFERENCES profiles(id);
    END IF;

    -- Add entry_location column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'entry_location'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN entry_location JSONB;
    END IF;

    -- Add exit_location column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'exit_location'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN exit_location JSONB;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_passes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE gate_passes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Backfill property_id from unit_id for existing records
UPDATE gate_passes gp
SET property_id = u.property_id
FROM units u
WHERE gp.unit_id = u.id
AND gp.property_id IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_gate_passes_property ON gate_passes(property_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_status ON gate_passes(status);
CREATE INDEX IF NOT EXISTS idx_gate_passes_valid_until ON gate_passes(valid_until);

-- Function to generate short access code
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire passes
CREATE OR REPLACE FUNCTION expire_old_passes()
RETURNS void AS $$
BEGIN
    UPDATE gate_passes 
    SET status = 'expired'::pass_status, updated_at = NOW()
    WHERE status IN ('active'::pass_status) 
    AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Drop existing guard policies that might conflict
DROP POLICY IF EXISTS "Guards can view property passes" ON gate_passes;
DROP POLICY IF EXISTS "Guards can update pass status" ON gate_passes;

-- Create new RLS policies using property_guards table (correct table name)
CREATE POLICY "Guards can view property passes"
    ON gate_passes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM property_guards pg
            JOIN units u ON u.property_id = pg.property_id
            WHERE u.id = gate_passes.unit_id
            AND pg.guard_id = auth.uid()
            AND pg.is_active = true
        )
    );

CREATE POLICY "Guards can update pass status"
    ON gate_passes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM property_guards pg
            JOIN units u ON u.property_id = pg.property_id
            WHERE u.id = gate_passes.unit_id
            AND pg.guard_id = auth.uid()
            AND pg.is_active = true
        )
    );
