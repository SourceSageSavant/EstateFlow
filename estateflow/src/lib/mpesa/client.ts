// M-Pesa Daraja API Client
import {
    MpesaCredentials,
    MpesaAccessTokenResponse,
    MpesaSTKPushRequest,
    MpesaSTKPushResponse,
    MpesaCallbackBody,
    MpesaCallbackMetadata,
} from './types';

// API URLs
const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_URL = 'https://api.safaricom.co.ke';

/**
 * Get the base URL based on environment
 */
export function getBaseUrl(environment: 'sandbox' | 'production'): string {
    return environment === 'production' ? PRODUCTION_URL : SANDBOX_URL;
}

/**
 * Generate OAuth access token
 */
export async function getAccessToken(
    credentials: MpesaCredentials
): Promise<string> {
    const baseUrl = getBaseUrl(credentials.environment);
    const auth = Buffer.from(
        `${credentials.consumerKey}:${credentials.consumerSecret}`
    ).toString('base64');

    const response = await fetch(
        `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data: MpesaAccessTokenResponse = await response.json();
    return data.access_token;
}

/**
 * Generate password for STK Push
 */
export function generatePassword(
    shortcode: string,
    passkey: string,
    timestamp: string
): string {
    const str = shortcode + passkey + timestamp;
    return Buffer.from(str).toString('base64');
}

/**
 * Generate timestamp in format YYYYMMDDHHmmss
 */
export function generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Format phone number to 254 format
 * Accepts: 0722123456, 254722123456, +254722123456, 722123456
 */
export function formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, and plus sign
    let cleaned = phone.replace(/[\s\-\+]/g, '');

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
    }

    // If doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned;
    }

    return cleaned;
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 */
export async function initiateSTKPush(
    credentials: MpesaCredentials,
    request: MpesaSTKPushRequest
): Promise<MpesaSTKPushResponse> {
    const baseUrl = getBaseUrl(credentials.environment);
    const accessToken = await getAccessToken(credentials);
    const timestamp = generateTimestamp();
    const password = generatePassword(
        credentials.shortcode,
        credentials.passkey,
        timestamp
    );

    const formattedPhone = formatPhoneNumber(request.phoneNumber);

    const body = {
        BusinessShortCode: credentials.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType:
            credentials.shortcodeType === 'paybill'
                ? 'CustomerPayBillOnline'
                : 'CustomerBuyGoodsOnline',
        Amount: Math.round(request.amount), // M-Pesa requires integer
        PartyA: formattedPhone,
        PartyB: credentials.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: request.callbackUrl,
        AccountReference: request.accountReference.substring(0, 12), // Max 12 chars
        TransactionDesc: request.transactionDesc.substring(0, 13), // Max 13 chars
    };

    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`STK Push failed: ${error}`);
    }

    return response.json();
}

/**
 * Parse callback metadata from M-Pesa response
 */
export function parseCallbackMetadata(
    callback: MpesaCallbackBody
): MpesaCallbackMetadata | null {
    const { stkCallback } = callback;

    if (stkCallback.ResultCode !== 0 || !stkCallback.CallbackMetadata) {
        return null;
    }

    const items = stkCallback.CallbackMetadata.Item;
    const metadata: Record<string, string | number | undefined> = {};

    for (const item of items) {
        metadata[item.Name] = item.Value;
    }

    return {
        amount: Number(metadata.Amount) || 0,
        mpesaReceiptNumber: String(metadata.MpesaReceiptNumber || ''),
        transactionDate: String(metadata.TransactionDate || ''),
        phoneNumber: String(metadata.PhoneNumber || ''),
    };
}

/**
 * Generate WhatsApp link for payment reminder (wa.me)
 */
export function generateWhatsAppPaymentLink(
    phoneNumber: string,
    message: string
): string {
    const cleanPhone = formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
