// M-Pesa API Types

export interface MpesaCredentials {
    consumerKey: string;
    consumerSecret: string;
    passkey: string;
    shortcode: string;
    shortcodeType: 'paybill' | 'till';
    environment: 'sandbox' | 'production';
}

export interface MpesaAccessTokenResponse {
    access_token: string;
    expires_in: string;
}

export interface MpesaSTKPushRequest {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
    callbackUrl: string;
}

export interface MpesaSTKPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

export interface MpesaCallbackBody {
    stkCallback: {
        MerchantRequestID: string;
        CheckoutRequestID: string;
        ResultCode: number;
        ResultDesc: string;
        CallbackMetadata?: {
            Item: Array<{
                Name: string;
                Value?: string | number;
            }>;
        };
    };
}

export interface MpesaCallbackMetadata {
    amount: number;
    mpesaReceiptNumber: string;
    transactionDate: string;
    phoneNumber: string;
}

// Payment Settings from database
export interface PaymentSettings {
    id: string;
    property_id: string;
    mpesa_enabled: boolean;
    mpesa_environment: 'sandbox' | 'production';
    mpesa_consumer_key: string | null;
    mpesa_consumer_secret: string | null;
    mpesa_passkey: string | null;
    mpesa_shortcode: string | null;
    mpesa_shortcode_type: 'paybill' | 'till';
    callback_url: string | null;
    created_at: string;
    updated_at: string;
}

// Payment Transaction from database
export interface PaymentTransaction {
    id: string;
    property_id: string;
    unit_id: string;
    tenant_id: string;
    amount: number;
    phone_number: string;
    payment_type: 'rent' | 'deposit' | 'penalty' | 'other';
    payment_period: string;
    description: string | null;
    merchant_request_id: string | null;
    checkout_request_id: string | null;
    mpesa_receipt_number: string | null;
    transaction_date: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    result_code: string | null;
    result_description: string | null;
    created_at: string;
    updated_at: string;
}
