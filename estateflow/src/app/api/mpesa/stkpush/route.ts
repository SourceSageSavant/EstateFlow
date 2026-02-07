// STK Push API Route - Initiate M-Pesa payment
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initiateSTKPush, formatPhoneNumber } from '@/lib/mpesa/client';
import { MpesaCredentials } from '@/lib/mpesa/types';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { propertyId, unitId, amount, phoneNumber, paymentType, paymentPeriod, description } = body;

        // Validate required fields
        if (!propertyId || !amount || !phoneNumber) {
            return NextResponse.json(
                { error: 'Missing required fields: propertyId, amount, phoneNumber' },
                { status: 400 }
            );
        }

        // Get payment settings for this property
        // @ts-ignore
        const { data: settings, error: settingsError } = await supabase
            .from('payment_settings')
            .select('*')
            .eq('property_id', propertyId)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'Payment settings not configured for this property' },
                { status: 400 }
            );
        }

        if (!settings.mpesa_enabled) {
            return NextResponse.json(
                { error: 'M-Pesa payments are not enabled for this property' },
                { status: 400 }
            );
        }

        // Check all required credentials exist
        if (!settings.mpesa_consumer_key || !settings.mpesa_consumer_secret ||
            !settings.mpesa_passkey || !settings.mpesa_shortcode) {
            return NextResponse.json(
                { error: 'M-Pesa credentials not fully configured' },
                { status: 400 }
            );
        }

        // Build credentials object
        const credentials: MpesaCredentials = {
            consumerKey: settings.mpesa_consumer_key,
            consumerSecret: settings.mpesa_consumer_secret,
            passkey: settings.mpesa_passkey,
            shortcode: settings.mpesa_shortcode,
            shortcodeType: settings.mpesa_shortcode_type || 'paybill',
            environment: settings.mpesa_environment || 'sandbox',
        };

        // Generate callback URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const callbackUrl = `${baseUrl}/api/mpesa/callback`;

        // Create transaction record first
        const transactionRef = `EST${Date.now()}`;
        // @ts-ignore
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .insert({
                property_id: propertyId,
                unit_id: unitId || null,
                tenant_id: user.id,
                amount: amount,
                phone_number: formatPhoneNumber(phoneNumber),
                payment_type: paymentType || 'rent',
                payment_period: paymentPeriod || null,
                description: description || `Payment for ${paymentType || 'rent'}`,
                status: 'pending',
            })
            .select()
            .single();

        if (txError) {
            console.error('Failed to create transaction:', txError);
            return NextResponse.json(
                { error: 'Failed to create payment record' },
                { status: 500 }
            );
        }

        // Initiate STK Push
        try {
            const stkResponse = await initiateSTKPush(credentials, {
                phoneNumber: phoneNumber,
                amount: amount,
                accountReference: transactionRef,
                transactionDesc: 'Rent Payment',
                callbackUrl: callbackUrl,
            });

            // Update transaction with M-Pesa request IDs
            // @ts-ignore
            await supabase
                .from('payment_transactions')
                .update({
                    merchant_request_id: stkResponse.MerchantRequestID,
                    checkout_request_id: stkResponse.CheckoutRequestID,
                    status: 'processing',
                })
                .eq('id', transaction.id);

            return NextResponse.json({
                success: true,
                message: stkResponse.CustomerMessage,
                transactionId: transaction.id,
                checkoutRequestId: stkResponse.CheckoutRequestID,
            });

        } catch (mpesaError: any) {
            // Update transaction as failed
            // @ts-ignore
            await supabase
                .from('payment_transactions')
                .update({
                    status: 'failed',
                    result_description: mpesaError.message,
                })
                .eq('id', transaction.id);

            console.error('M-Pesa STK Push error:', mpesaError);
            return NextResponse.json(
                { error: mpesaError.message || 'Failed to initiate payment' },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('STK Push route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
