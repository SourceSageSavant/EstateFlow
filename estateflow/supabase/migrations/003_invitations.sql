-- Migration: Invitations System
-- Allows landlords to invite tenants and guards via email

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('tenant', 'guard')),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Invitation token (used in URL)
    token TEXT UNIQUE NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    
    -- Expiry
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    accepted_at TIMESTAMPTZ,
    
    -- Metadata
    full_name TEXT, -- Optional: pre-fill name if known
    phone_number TEXT, -- Optional: pre-fill phone if known
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Landlords can view and manage their own invitations
CREATE POLICY "Landlords manage their invitations" ON invitations
    FOR ALL USING (invited_by = auth.uid());

-- Anyone can read invitation by token (for acceptance flow)
CREATE POLICY "Anyone can read invitation by token" ON invitations
    FOR SELECT USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS invitations_updated_at ON invitations;
CREATE TRIGGER invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_invitation_timestamp();

-- Function to expire old invitations (can be called via cron or manually)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
