-- ============================================
-- EstateFlow: Superadmin & SaaS Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add 'superadmin' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- 2. Subscription Plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  max_properties INTEGER NOT NULL DEFAULT 1,
  max_units_per_property INTEGER NOT NULL DEFAULT 10,
  max_guards INTEGER NOT NULL DEFAULT 2,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriptions table (links landlords to plans)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Superadmins can manage everything
CREATE POLICY "Superadmins manage plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Superadmins manage subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Users view own subscription" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- 6. Superadmins can view ALL profiles (for management)
CREATE POLICY "Superadmins view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

CREATE POLICY "Superadmins update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

-- 7. Superadmins can view ALL properties
CREATE POLICY "Superadmins view all properties" ON properties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

-- 8. Superadmins can view ALL units
CREATE POLICY "Superadmins view all units" ON units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'superadmin')
  );

-- 9. Seed default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_period, max_properties, max_units_per_property, max_guards, features)
VALUES
  ('Free', 'Get started with basic features', 0, 'monthly', 1, 5, 1, '["Gate passes", "Basic dashboard"]'),
  ('Starter', 'Perfect for small landlords', 1500, 'monthly', 3, 20, 3, '["Gate passes", "Rent collection", "Maintenance requests", "Email support"]'),
  ('Professional', 'For growing property portfolios', 4500, 'monthly', 10, 50, 10, '["Everything in Starter", "Lease management", "Analytics", "Priority support"]'),
  ('Enterprise', 'Unlimited scale for large operators', 12000, 'monthly', 999, 999, 999, '["Everything in Professional", "Custom branding", "API access", "Dedicated support"]')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- DONE! Now create a superadmin user:
--
-- UPDATE profiles
-- SET role = 'superadmin'
-- WHERE id = 'YOUR_USER_UUID_HERE';
-- ============================================
