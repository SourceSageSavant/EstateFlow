import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

        // Get current user (guard)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a guard
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'guard') {
            return NextResponse.json({ error: 'Only guards can verify passes' }, { status: 403 });
        }

        // Get access code from request
        const body = await request.json();
        const { accessCode } = body;

        if (!accessCode) {
            return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
        }

        // Look up the pass
        // @ts-ignore - gate_passes table not in types yet
        const { data: pass, error: passError } = await supabase
            .from('gate_passes')
            .select(`
                *,
                properties(name, address),
                units(unit_number),
                profiles:tenant_id(full_name, phone)
            `)
            .eq('access_code', accessCode.toUpperCase())
            .single();

        if (passError || !pass) {
            return NextResponse.json({
                valid: false,
                error: 'Pass not found',
                message: 'No pass exists with this code',
            }, { status: 404 });
        }

        // Check if pass is expired
        const now = new Date();
        const validFrom = new Date(pass.valid_from);
        const validUntil = new Date(pass.valid_until);

        if (now < validFrom) {
            return NextResponse.json({
                valid: false,
                error: 'Pass not yet valid',
                message: `This pass is valid from ${validFrom.toLocaleString()}`,
                pass: {
                    visitorName: pass.visitor_name,
                    validFrom: pass.valid_from,
                    validUntil: pass.valid_until,
                },
            });
        }

        if (now > validUntil) {
            // Update status to expired
            // @ts-ignore
            await supabase
                .from('gate_passes')
                .update({ status: 'expired' })
                .eq('id', pass.id);

            return NextResponse.json({
                valid: false,
                error: 'Pass expired',
                message: `This pass expired on ${validUntil.toLocaleString()}`,
                pass: {
                    visitorName: pass.visitor_name,
                    validFrom: pass.valid_from,
                    validUntil: pass.valid_until,
                    status: 'expired',
                },
            });
        }

        // Check pass status
        if (pass.status === 'cancelled') {
            return NextResponse.json({
                valid: false,
                error: 'Pass cancelled',
                message: 'This pass has been cancelled by the tenant',
                pass: {
                    visitorName: pass.visitor_name,
                    status: 'cancelled',
                },
            });
        }

        // Pass is valid!
        return NextResponse.json({
            valid: true,
            message: 'Pass is valid',
            pass: {
                id: pass.id,
                accessCode: pass.access_code,
                visitorName: pass.visitor_name,
                visitorPhone: pass.visitor_phone,
                visitorIdNumber: pass.visitor_id_number,
                visitorVehicle: pass.visitor_vehicle,
                purpose: pass.purpose,
                validFrom: pass.valid_from,
                validUntil: pass.valid_until,
                status: pass.status,
                property: pass.properties?.name,
                propertyAddress: pass.properties?.address,
                unit: pass.units?.unit_number,
                tenantName: pass.profiles?.full_name,
                tenantPhone: pass.profiles?.phone,
                checkedInAt: pass.checked_in_at,
            },
        });

    } catch (error) {
        console.error('Verify pass error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
