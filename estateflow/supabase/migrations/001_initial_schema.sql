-- 001_initial_schema.sql
-- EstateFlow Initial Schema
-- Core tables: profiles, properties, units, property_guards,
-- guard_assignments, maintenance_requests, gate_passes, banned_visitors

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Enum Types
-- ============================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('landlord', 'tenant', 'guard', 'superadmin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 1. Profiles (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role user_role NOT NULL DEFAULT 'landlord',
    full_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS is managed by 008_fix_profiles_rls_recursion.sql
-- (SECURITY DEFINER functions to avoid infinite recursion)

-- ============================================================
-- 2. Properties
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    total_units INTEGER DEFAULT 0,
    -- Geofencing columns (also in 005_geofencing.sql as ALTER TABLE)
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geofence_radius INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords manage own properties" ON properties
    FOR ALL USING (landlord_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);

-- ============================================================
-- 3. Units
-- ============================================================
CREATE TABLE IF NOT EXISTS units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    unit_number TEXT NOT NULL,
    rent_amount NUMERIC(10, 2) DEFAULT 0,
    rent_due_day INTEGER DEFAULT 1,
    status TEXT DEFAULT 'vacant',
    current_tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Units visible to property owner" ON units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = units.property_id
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can view own unit" ON units
    FOR SELECT USING (current_tenant_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant ON units(current_tenant_id);

-- ============================================================
-- 4. Property Guards (assignment tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS property_guards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    guard_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, guard_id)
);

ALTER TABLE property_guards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords manage property guards" ON property_guards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_guards.property_id
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Guards can view own assignments" ON property_guards
    FOR SELECT USING (guard_id = auth.uid());

-- ============================================================
-- 5. Guard Assignments (schedule/shift-based)
-- ============================================================
CREATE TABLE IF NOT EXISTS guard_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    guard_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guard_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords manage guard assignments" ON guard_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = guard_assignments.property_id
            AND properties.landlord_id = auth.uid()
        )
    );

CREATE POLICY "Guards can view own assignments" ON guard_assignments
    FOR SELECT USING (guard_id = auth.uid());

-- ============================================================
-- 6. Maintenance Requests
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants manage own requests" ON maintenance_requests
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "Landlords view property requests" ON maintenance_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = maintenance_requests.unit_id
            AND p.landlord_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);

-- ============================================================
-- 7. Gate Passes (base table — enhanced by 004_gate_passes.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS gate_passes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_phone TEXT,
    visitor_id_number TEXT,
    purpose TEXT,
    access_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gate_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants manage own passes" ON gate_passes
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "Guards can view property passes" ON gate_passes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM property_guards pg
            JOIN units u ON u.property_id = pg.property_id
            WHERE u.id = gate_passes.unit_id
            AND pg.guard_id = auth.uid()
            AND pg.is_active = true
        )
    );

CREATE POLICY "Landlords view property passes" ON gate_passes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = gate_passes.unit_id
            AND p.landlord_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_gate_passes_tenant ON gate_passes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_access_code ON gate_passes(access_code);

-- ============================================================
-- 8. Banned Visitors
-- ============================================================
CREATE TABLE IF NOT EXISTS banned_visitors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    visitor_name TEXT NOT NULL,
    id_number TEXT,
    reason TEXT,
    banned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE banned_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guards manage banned visitors" ON banned_visitors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM property_guards pg
            WHERE pg.property_id = banned_visitors.property_id
            AND pg.guard_id = auth.uid()
            AND pg.is_active = true
        )
    );

CREATE POLICY "Landlords view banned visitors" ON banned_visitors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = banned_visitors.property_id
            AND properties.landlord_id = auth.uid()
        )
    );

-- ============================================================
-- Auth Trigger: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'landlord')::user_role,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$;

-- Drop trigger if it already exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Updated_at Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all tables with that column
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'updated_at'
        AND table_name IN (
            'profiles', 'properties', 'units', 'maintenance_requests',
            'gate_passes', 'guard_assignments'
        )
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I; '
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I '
            'FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
            tbl, tbl
        );
    END LOOP;
END $$;
