import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate a 6-character access code using crypto-secure randomness
function generateAccessCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(crypto.randomInt(chars.length));
    }
    return result;
}

export async function POST(request: NextRequest) {
    try {
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

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a tenant (only tenants create gate passes)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'tenant') {
            return NextResponse.json({ error: 'Only tenants can create gate passes' }, { status: 403 });
        }

        // Get request body
        const body = await request.json();
        const {
            visitorName,
            visitorPhone,
            visitorIdNumber,
            visitorVehicle,
            purpose,
            validFrom,
            validUntil,
            propertyId,
            unitId,
        } = body;

        // Validate required fields
        if (!visitorName || !validUntil || !propertyId) {
            return NextResponse.json(
                { error: 'Visitor name, valid until date, and property are required' },
                { status: 400 }
            );
        }

        // Generate unique access code
        let accessCode = generateAccessCode();
        let attempts = 0;

        // Ensure code is unique
        while (attempts < 10) {
            const { data: existing } = await supabase
                .from('gate_passes')
                .select('id')
                .eq('access_code', accessCode)
                .single();

            if (!existing) break;
            accessCode = generateAccessCode();
            attempts++;
        }

        // Create QR data
        const qrData = JSON.stringify({
            code: accessCode,
            property: propertyId,
            visitor: visitorName,
        });

        // Generate QR code as base64
        const qrCodeImage = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#1e293b',
                light: '#ffffff',
            },
        });

        // Create the pass
        const { data: pass, error: insertError } = await supabase
            .from('gate_passes')
            .insert({
                tenant_id: user.id,
                property_id: propertyId,
                unit_id: unitId || null,
                visitor_name: visitorName,
                visitor_phone: visitorPhone || null,
                visitor_id_number: visitorIdNumber || null,
                visitor_vehicle: visitorVehicle || null,
                purpose: purpose || null,
                access_code: accessCode,
                qr_data: qrCodeImage,
                valid_from: validFrom || new Date().toISOString(),
                valid_until: validUntil,
                status: 'pending',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create pass' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            pass: {
                id: pass.id,
                accessCode: pass.access_code,
                qrCode: pass.qr_data,
                visitorName: pass.visitor_name,
                validFrom: pass.valid_from,
                validUntil: pass.valid_until,
                status: pass.status,
            },
        });

    } catch (error) {
        console.error('Create pass error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
