// M-Pesa Callback Route - Handle payment confirmation from Safaricom
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { parseCallbackMetadata } from '@/lib/mpesa/client';
import { MpesaCallbackBody } from '@/lib/mpesa/types';

// Safaricom IP ranges (production + sandbox)
// Reference: https://developer.safaricom.co.ke/Documentation
const SAFARICOM_IP_RANGES = [
    '196.201.214.',   // Production range
    '196.201.213.',   // Production range
    '192.168.',       // Sandbox/testing (localhost proxies)
    '127.0.0.',       // Localhost
    '::1',            // IPv6 localhost
];

function isSafaricomIP(ip: string): boolean {
    if (!ip) return false;
    // In development, allow all
    if (process.env.NODE_ENV === 'development') return true;
    return SAFARICOM_IP_RANGES.some(range => ip.startsWith(range));
}

// Create supabase admin client (needs service role for callback)
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: NextRequest) {
    const supabase = getSupabaseAdmin();

    // --- IP Validation: Only accept callbacks from Safaricom ---
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIP = forwardedFor?.split(',')[0]?.trim() || 'unknown';

    if (!isSafaricomIP(clientIP)) {
        console.warn(`[M-Pesa] Rejected callback from non-Safaricom IP: ${clientIP}`);
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' }); // Don't reveal we rejected it
    }

    try {
        const body: { Body: MpesaCallbackBody } = await request.json();

        console.log('[M-Pesa] Callback received from IP:', clientIP);

        const callback = body.Body;
        const { stkCallback } = callback;

        // --- Idempotency: Don't process the same callback twice ---
        const { data: transaction, error: findError } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('checkout_request_id', stkCallback.CheckoutRequestID)
            .single();

        if (findError || !transaction) {
            console.error('[M-Pesa] Transaction not found:', stkCallback.CheckoutRequestID);
            return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        // Skip if already processed (idempotency guard)
        if (transaction.status === 'completed' || transaction.status === 'failed') {
            console.log('[M-Pesa] Already processed, skipping:', transaction.id);
            return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
        }

        // Check result code
        if (stkCallback.ResultCode === 0) {
            // Payment was successful
            const metadata = parseCallbackMetadata(callback);

            await supabase
                .from('payment_transactions')
                .update({
                    status: 'completed',
                    result_code: String(stkCallback.ResultCode),
                    result_description: stkCallback.ResultDesc,
                    mpesa_receipt_number: metadata?.mpesaReceiptNumber || null,
                    transaction_date: metadata?.transactionDate
                        ? new Date(
                            metadata.transactionDate.replace(
                                /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                                '$1-$2-$3T$4:$5:$6'
                            )
                        ).toISOString()
                        : new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', transaction.id);

            console.log('[M-Pesa] Payment completed:', transaction.id, metadata?.mpesaReceiptNumber);

        } else {
            // Payment failed or was cancelled
            await supabase
                .from('payment_transactions')
                .update({
                    status: 'failed',
                    result_code: String(stkCallback.ResultCode),
                    result_description: stkCallback.ResultDesc,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', transaction.id);

            console.log('[M-Pesa] Payment failed:', transaction.id, stkCallback.ResultDesc);
        }

        // Always return success to Safaricom
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });

    } catch (error: any) {
        console.error('[M-Pesa] Callback processing error:', error);
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
    }
}

// GET endpoint to check transaction status (AUTHENTICATED - owner only)
export async function GET(request: NextRequest) {
    // --- Require authentication ---
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!transactionId && !checkoutRequestId) {
        return NextResponse.json(
            { error: 'Provide transactionId or checkoutRequestId' },
            { status: 400 }
        );
    }

    // Use admin client for the lookup, then verify ownership
    const adminSupabase = getSupabaseAdmin();
    let query = adminSupabase
        .from('payment_transactions')
        .select('id, tenant_id, status, mpesa_receipt_number, result_description, amount, created_at');

    if (transactionId) {
        query = query.eq('id', transactionId);
    } else if (checkoutRequestId) {
        query = query.eq('checkout_request_id', checkoutRequestId);
    }

    const { data: transaction, error } = await query.single();

    if (error || !transaction) {
        return NextResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
        );
    }

    // --- Ownership check: only the tenant who initiated can check status ---
    if (transaction.tenant_id !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
        id: transaction.id,
        status: transaction.status,
        receiptNumber: transaction.mpesa_receipt_number,
        message: transaction.result_description,
        amount: transaction.amount,
        createdAt: transaction.created_at,
    });
}
