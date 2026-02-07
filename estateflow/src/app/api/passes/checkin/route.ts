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

        // Get request body
        const body = await request.json();
        const { passId, location } = body;

        if (!passId) {
            return NextResponse.json({ error: 'Pass ID is required' }, { status: 400 });
        }

        // Get the pass
        // @ts-ignore - gate_passes table not in types yet
        const { data: pass, error: passError } = await supabase
            .from('gate_passes')
            .select('*')
            .eq('id', passId)
            .single();

        if (passError || !pass) {
            return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
        }

        // Verify pass is still valid
        const now = new Date();
        const validUntil = new Date(pass.valid_until);

        if (now > validUntil) {
            return NextResponse.json({ error: 'Pass has expired' }, { status: 400 });
        }

        if (pass.status === 'cancelled') {
            return NextResponse.json({ error: 'Pass has been cancelled' }, { status: 400 });
        }

        if (pass.status === 'checked_in') {
            return NextResponse.json({ error: 'Visitor is already checked in' }, { status: 400 });
        }

        // Update pass to checked in
        // @ts-ignore
        const { data: updatedPass, error: updateError } = await supabase
            .from('gate_passes')
            .update({
                status: 'checked_in',
                checked_in_at: new Date().toISOString(),
                checked_in_by: user.id,
                entry_location: location || null,
            })
            .eq('id', passId)
            .select()
            .single();

        if (updateError) {
            console.error('Check-in error:', updateError);
            return NextResponse.json({ error: 'Failed to check in visitor' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Visitor checked in successfully',
            pass: {
                id: updatedPass.id,
                visitorName: updatedPass.visitor_name,
                status: updatedPass.status,
                checkedInAt: updatedPass.checked_in_at,
            },
        });

    } catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
