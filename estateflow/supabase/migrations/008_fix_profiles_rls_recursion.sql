-- 008_fix_profiles_rls_recursion.sql
-- Fixes infinite recursion between profiles <-> properties RLS policies
--
-- ROOT CAUSE: profiles has policies that join properties/units,
-- and properties has a policy that joins profiles (superadmin check).
-- This creates a cycle: properties -> profiles -> properties -> ...
--
-- FIX: Use SECURITY DEFINER functions to break the cycle.

-- ============================================================
-- STEP 1: Drop ALL existing policies on profiles (regardless of name)
-- ============================================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Also drop the superadmin-related policies on properties that reference profiles
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'properties' AND schemaname = 'public'
        AND policyname ILIKE '%superadmin%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', pol.policyname);
        RAISE NOTICE 'Dropped properties policy: %', pol.policyname;
    END LOOP;
END $$;

-- ============================================================
-- STEP 2: Create SECURITY DEFINER helper functions
-- These bypass RLS so they don't trigger recursive policy checks
-- ============================================================

-- Check if the current user is a superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'superadmin'
    );
$$;

-- Check if current user is a landlord who manages the target user
-- (target is a tenant in their unit, or a guard assigned to their property)
CREATE OR REPLACE FUNCTION public.is_landlord_of_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM units u
        JOIN properties p ON p.id = u.property_id
        WHERE u.current_tenant_id = target_user_id
        AND p.landlord_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM property_guards pg
        JOIN properties p ON p.id = pg.property_id
        WHERE pg.guard_id = target_user_id
        AND p.landlord_id = auth.uid()
        AND pg.is_active = true
    );
$$;

-- ============================================================
-- STEP 3: Recreate clean profiles policies (non-recursive)
-- ============================================================

-- Users can always see their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Users can insert their own profile (signup trigger)
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Landlords can see profiles of their tenants and guards
CREATE POLICY "profiles_select_landlord_view" ON profiles
    FOR SELECT USING (is_landlord_of_user(id));

-- Superadmins can see all profiles
CREATE POLICY "profiles_select_superadmin" ON profiles
    FOR SELECT USING (is_superadmin());

-- Superadmins can update any profile
CREATE POLICY "profiles_update_superadmin" ON profiles
    FOR UPDATE USING (is_superadmin())
    WITH CHECK (is_superadmin());

-- ============================================================
-- STEP 4: Fix properties policies that reference profiles
-- Replace inline subquery with SECURITY DEFINER function
-- ============================================================

-- Re-create superadmin property access using the safe function
CREATE POLICY "Superadmin view all properties" ON properties
    FOR SELECT USING (is_superadmin());
