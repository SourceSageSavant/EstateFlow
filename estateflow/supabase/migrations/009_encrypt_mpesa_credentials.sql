-- 009_encrypt_mpesa_credentials.sql
-- Encrypts M-Pesa credentials at rest using pgcrypto
--
-- IMPORTANT: Set the encryption key as a database secret:
--   ALTER DATABASE postgres SET app.encryption_key = 'your-32-char-hex-key-here';
-- Or set it via Supabase Dashboard > Settings > Database > Configuration
--
-- Generate a key with: SELECT encode(gen_random_bytes(32), 'hex');

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Helper functions for encrypt/decrypt
-- These use AES-256 encryption with the app.encryption_key setting
-- ============================================================

-- Encrypt a text value
CREATE OR REPLACE FUNCTION public.encrypt_credential(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    enc_key BYTEA;
BEGIN
    IF plain_text IS NULL OR plain_text = '' THEN
        RETURN plain_text;
    END IF;

    enc_key := decode(current_setting('app.encryption_key', true), 'hex');
    IF enc_key IS NULL THEN
        -- If no encryption key is set, return plaintext (graceful degradation)
        RAISE WARNING 'app.encryption_key not set — storing credential in plaintext';
        RETURN plain_text;
    END IF;

    RETURN encode(
        pgp_sym_encrypt(plain_text, encode(enc_key, 'escape')),
        'base64'
    );
END;
$$;

-- Decrypt a text value
CREATE OR REPLACE FUNCTION public.decrypt_credential(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    enc_key BYTEA;
BEGIN
    IF encrypted_text IS NULL OR encrypted_text = '' THEN
        RETURN encrypted_text;
    END IF;

    enc_key := decode(current_setting('app.encryption_key', true), 'hex');
    IF enc_key IS NULL THEN
        -- If no key, assume data is plaintext
        RETURN encrypted_text;
    END IF;

    BEGIN
        RETURN pgp_sym_decrypt(
            decode(encrypted_text, 'base64'),
            encode(enc_key, 'escape')
        );
    EXCEPTION WHEN OTHERS THEN
        -- If decryption fails, data might be plaintext (pre-migration)
        RETURN encrypted_text;
    END;
END;
$$;

-- ============================================================
-- Create a secure view that decrypts credentials on read
-- API routes should use this view instead of the raw table
-- ============================================================
CREATE OR REPLACE VIEW public.payment_settings_decrypted AS
SELECT
    id,
    property_id,
    mpesa_enabled,
    mpesa_environment,
    decrypt_credential(mpesa_consumer_key) AS mpesa_consumer_key,
    decrypt_credential(mpesa_consumer_secret) AS mpesa_consumer_secret,
    decrypt_credential(mpesa_passkey) AS mpesa_passkey,
    mpesa_shortcode,
    mpesa_shortcode_type,
    callback_url,
    created_at,
    updated_at
FROM payment_settings;

-- Grant access to the view
GRANT SELECT ON public.payment_settings_decrypted TO authenticated;

-- ============================================================
-- INSTRUCTIONS FOR USE:
-- ============================================================
-- 1. Generate an encryption key:
--    SELECT encode(gen_random_bytes(32), 'hex');
--
-- 2. Set it in the database:
--    ALTER DATABASE postgres SET app.encryption_key = '<key-from-step-1>';
--
-- 3. Encrypt existing plaintext credentials (one-time migration):
--    UPDATE payment_settings SET
--      mpesa_consumer_key = encrypt_credential(mpesa_consumer_key),
--      mpesa_consumer_secret = encrypt_credential(mpesa_consumer_secret),
--      mpesa_passkey = encrypt_credential(mpesa_passkey)
--    WHERE mpesa_consumer_key IS NOT NULL;
--
-- 4. In your API code, read from `payment_settings_decrypted` view
--    instead of `payment_settings` table to get auto-decrypted values.
--
-- 5. When WRITING new credentials, use encrypt_credential():
--    INSERT INTO payment_settings (mpesa_consumer_key, ...)
--    VALUES (encrypt_credential('key-value'), ...)
