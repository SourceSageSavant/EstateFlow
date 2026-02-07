// M-Pesa Callback Route - Handle payment confirmation from Safaricom
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseCallbackMetadata } from '@/lib/mpesa/client';
import { MpesaCallbackBody } from '@/lib/mpesa/types';

// Create supabase client (needs to be in function scope for build)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: NextRequest) {
    const supabase = getSupabase();

    try {
        const body: { Body: MpesaCallbackBody } = await request.json();

        console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

        const callback = body.Body;
        const { stkCallback } = callback;

        // Find the transaction by CheckoutRequestID
        const { data: transaction, error: findError } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('checkout_request_id', stkCallback.CheckoutRequestID)
            .single();

        if (findError || !transaction) {
            console.error('Transaction not found:', stkCallback.CheckoutRequestID);
            // Still return 200 to Safaricom to prevent retries
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
                .eq('id', (transaction as any).id);

            console.log('Payment completed:', (transaction as any).id, metadata?.mpesaReceiptNumber);

            // TODO: Send WhatsApp/SMS confirmation to tenant
            // TODO: Update payment records in main payments table

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
                .eq('id', (transaction as any).id);

            console.log('Payment failed:', (transaction as any).id, stkCallback.ResultDesc);
        }

        // Always return success to Safaricom
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });

    } catch (error: any) {
        console.error('Callback processing error:', error);
        // Still return success to prevent Safaricom retries
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
    }
}

// GET endpoint to check transaction status (for polling)
export async function GET(request: NextRequest) {
    const supabase = getSupabase();

    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!transactionId && !checkoutRequestId) {
        return NextResponse.json(
            { error: 'Provide transactionId or checkoutRequestId' },
            { status: 400 }
        );
    }

    let query = supabase
        .from('payment_transactions')
        .select('id, status, mpesa_receipt_number, result_description, amount, created_at');

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

    const tx = transaction as any;
    return NextResponse.json({
        id: tx.id,
        status: tx.status,
        receiptNumber: tx.mpesa_receipt_number,
        message: tx.result_description,
        amount: tx.amount,
        createdAt: tx.created_at,
    });
}

