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
            return NextResponse.json({ error: 'Only guards can check out visitors' }, { status: 403 });
        }

        // Get request body
        const body = await request.json();
        const { passId, location } = body;

        if (!passId) {
            return NextResponse.json({ error: 'Pass ID is required' }, { status: 400 });
        }

        // Get the pass
        const { data: pass, error: passError } = await supabase
            .from('gate_passes')
            .select('*')
            .eq('id', passId)
            .single();

        if (passError || !pass) {
            return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
        }

        if (pass.status !== 'checked_in') {
            return NextResponse.json({ error: 'Visitor is not checked in' }, { status: 400 });
        }

        // Update pass to checked out
        const { data: updatedPass, error: updateError } = await supabase
            .from('gate_passes')
            .update({
                status: 'checked_out',
                checked_out_at: new Date().toISOString(),
                checked_out_by: user.id,
                exit_location: location || null,
            })
            .eq('id', passId)
            .select()
            .single();

        if (updateError) {
            console.error('Check-out error:', updateError);
            return NextResponse.json({ error: 'Failed to check out visitor' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Visitor checked out successfully',
            pass: {
                id: updatedPass.id,
                visitorName: updatedPass.visitor_name,
                status: updatedPass.status,
                checkedOutAt: updatedPass.checked_out_at,
            },
        });

    } catch (error) {
        console.error('Check-out error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
