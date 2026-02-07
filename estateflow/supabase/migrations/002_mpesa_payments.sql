-- M-Pesa Payment Integration Schema
-- Run this AFTER the main schema.sql

-- Payment Settings (per property)
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
    
    -- M-Pesa Configuration
    mpesa_enabled BOOLEAN DEFAULT false,
    mpesa_environment TEXT DEFAULT 'sandbox', -- sandbox | production
    mpesa_consumer_key TEXT,
    mpesa_consumer_secret TEXT,
    mpesa_passkey TEXT,
    mpesa_shortcode TEXT,
    mpesa_shortcode_type TEXT DEFAULT 'paybill', -- paybill | till
    
    -- Callback URL (system generates this)
    callback_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Payment Details
    amount NUMERIC(10, 2) NOT NULL,
    phone_number TEXT NOT NULL,
    payment_type TEXT DEFAULT 'rent', -- rent | deposit | penalty | other
    payment_period TEXT, -- e.g., "2026-02" for February 2026
    description TEXT,
    
    -- M-Pesa Request
    merchant_request_id TEXT,
    checkout_request_id TEXT UNIQUE,
    
    -- M-Pesa Response
    mpesa_receipt_number TEXT,
    transaction_date TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending | processing | completed | failed | cancelled
    result_code TEXT,
    result_description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_checkout ON payment_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- RLS Policies
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Landlords can manage their payment settings
CREATE POLICY "Landlords manage payment settings" ON payment_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = payment_settings.property_id
            AND p.landlord_id = auth.uid()
        )
    );

-- Tenants can view their own transactions
CREATE POLICY "Tenants view own transactions" ON payment_transactions
    FOR SELECT USING (tenant_id = auth.uid());

-- Landlords can view property transactions
CREATE POLICY "Landlords view property transactions" ON payment_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = payment_transactions.property_id
            AND p.landlord_id = auth.uid()
        )
    );

-- System can insert/update transactions (service role bypasses RLS)
