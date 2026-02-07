-- 006_leases.sql

-- Create Lease Status Enum
CREATE TYPE lease_status AS ENUM ('draft', 'pending_signature', 'active', 'terminated', 'expired');

-- Create Leases Table
CREATE TABLE leases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rent_amount NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0,
    status lease_status DEFAULT 'draft',
    terms_text TEXT, -- Custom terms or full HTML content
    pdf_url TEXT, -- Path to signed PDF in storage
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT lease_dates_check CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Policies

-- Landlords view leases for their properties
CREATE POLICY "Landlords view leases" ON leases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = leases.unit_id
            AND p.landlord_id = auth.uid()
        )
    );

-- Tenants view their own leases
CREATE POLICY "Tenants view own leases" ON leases
    FOR SELECT USING (tenant_id = auth.uid());

-- Tenants can update (sign) their own leases if status is pending
CREATE POLICY "Tenants update own leases" ON leases
    FOR UPDATE USING (tenant_id = auth.uid())
    WITH CHECK (tenant_id = auth.uid());
