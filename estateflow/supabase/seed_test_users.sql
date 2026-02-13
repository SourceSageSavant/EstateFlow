-- ============================================
-- EstateFlow: Seed Test Guard & Tenant
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  guard_uid UUID;
  tenant_uid UUID;
  first_property_id UUID;
  first_vacant_unit_id UUID;
BEGIN

  -- ==========================================
  -- 1. CLEAN UP old test users (if any)
  -- ==========================================
  DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email IN ('guard@test.com', 'tenant@test.com'));
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('guard@test.com', 'tenant@test.com'));
  DELETE FROM auth.users WHERE email IN ('guard@test.com', 'tenant@test.com');

  -- ==========================================
  -- 2. CREATE GUARD AUTH USER + IDENTITY
  -- ==========================================
  guard_uid := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token, email_change_token_new
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    guard_uid,
    'authenticated',
    'authenticated',
    'guard@test.com',
    crypt('test1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Kevin Ochieng"}',
    false, '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    guard_uid,
    guard_uid,
    jsonb_build_object('sub', guard_uid::text, 'email', 'guard@test.com', 'email_verified', true, 'phone_verified', false),
    'email',
    guard_uid::text,
    NOW(), NOW(), NOW()
  );

  RAISE NOTICE 'Created guard: guard@test.com (%)' , guard_uid;

  -- ==========================================
  -- 3. CREATE TENANT AUTH USER + IDENTITY
  -- ==========================================
  tenant_uid := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token, email_change_token_new
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    tenant_uid,
    'authenticated',
    'authenticated',
    'tenant@test.com',
    crypt('test1234', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mary Wanjiku"}',
    false, '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    tenant_uid,
    tenant_uid,
    jsonb_build_object('sub', tenant_uid::text, 'email', 'tenant@test.com', 'email_verified', true, 'phone_verified', false),
    'email',
    tenant_uid::text,
    NOW(), NOW(), NOW()
  );

  RAISE NOTICE 'Created tenant: tenant@test.com (%)', tenant_uid;

  -- ==========================================
  -- 4. CREATE PROFILES
  -- ==========================================
  INSERT INTO profiles (id, role, full_name, phone_number)
  VALUES (guard_uid, 'guard', 'Kevin Ochieng', '+254712345678')
  ON CONFLICT (id) DO UPDATE SET role = 'guard', full_name = 'Kevin Ochieng', phone_number = '+254712345678';

  INSERT INTO profiles (id, role, full_name, phone_number)
  VALUES (tenant_uid, 'tenant', 'Mary Wanjiku', '+254798765432')
  ON CONFLICT (id) DO UPDATE SET role = 'tenant', full_name = 'Mary Wanjiku', phone_number = '+254798765432';

  RAISE NOTICE 'Created profiles for both users';

  -- ==========================================
  -- 5. ASSIGN GUARD TO FIRST PROPERTY
  -- ==========================================
  SELECT id INTO first_property_id FROM properties ORDER BY created_at ASC LIMIT 1;

  IF first_property_id IS NOT NULL THEN
    INSERT INTO property_guards (property_id, guard_id, shift, is_active)
    VALUES (first_property_id, guard_uid, 'all', true);
    RAISE NOTICE 'Assigned guard to property %', first_property_id;
  ELSE
    RAISE NOTICE 'WARNING: No properties found!';
  END IF;

  -- ==========================================
  -- 6. ASSIGN TENANT TO FIRST VACANT UNIT
  -- ==========================================
  SELECT id INTO first_vacant_unit_id
  FROM units
  WHERE current_tenant_id IS NULL OR status = 'vacant'
  ORDER BY created_at ASC
  LIMIT 1;

  IF first_vacant_unit_id IS NOT NULL THEN
    UPDATE units
    SET current_tenant_id = tenant_uid, status = 'occupied'
    WHERE id = first_vacant_unit_id;
    RAISE NOTICE 'Assigned tenant to unit %', first_vacant_unit_id;
  ELSE
    RAISE NOTICE 'WARNING: No vacant units found!';
  END IF;

END $$;

-- ============================================
-- DONE! Log in with:
--   Guard:  guard@test.com  / test1234
--   Tenant: tenant@test.com / test1234
-- ============================================
