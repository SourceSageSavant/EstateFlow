import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client for accepting invitations (user won't be authenticated yet)
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// POST - Accept invitation and create account
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { token, password, fullName, phoneNumber } = body;

        if (!token || !password || !fullName) {
            return NextResponse.json(
                { error: 'Missing required fields: token, password, fullName' },
                { status: 400 }
            );
        }

        // Find invitation by token
        const { data: invitation, error: findError } = await supabase
            .from('invitations')
            .select(`
                *,
                properties:property_id(id, name),
                units:unit_id(id, unit_number)
            `)
            .eq('token', token)
            .eq('status', 'pending')
            .single();

        if (findError || !invitation) {
            return NextResponse.json(
                { error: 'Invalid or expired invitation' },
                { status: 404 }
            );
        }

        // Check if expired
        if (new Date(invitation.expires_at) < new Date()) {
            // Mark as expired
            await supabase
                .from('invitations')
                .update({ status: 'expired' })
                .eq('id', invitation.id);

            return NextResponse.json(
                { error: 'This invitation has expired. Please request a new one.' },
                { status: 410 }
            );
        }

        // Check if email already registered
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const emailExists = existingUser?.users?.some(u => u.email === invitation.email);

        if (emailExists) {
            return NextResponse.json(
                { error: 'An account with this email already exists. Please log in instead.' },
                { status: 409 }
            );
        }

        // Create auth user
        const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
            email: invitation.email,
            password: password,
            email_confirm: true, // Auto-confirm since we're using invitation
            user_metadata: {
                full_name: fullName,
                role: invitation.role,
            }
        });

        if (signUpError || !authUser.user) {
            console.error('Failed to create user:', signUpError);
            return NextResponse.json(
                { error: signUpError?.message || 'Failed to create account' },
                { status: 500 }
            );
        }

        // Create profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authUser.user.id,
                email: invitation.email,
                full_name: fullName,
                phone_number: phoneNumber || invitation.phone_number || null,
                role: invitation.role,
                unit_id: invitation.unit_id || null,
            });

        if (profileError) {
            console.error('Failed to create profile:', profileError);
            // Attempt to clean up auth user
            await supabase.auth.admin.deleteUser(authUser.user.id);
            return NextResponse.json(
                { error: 'Failed to create profile' },
                { status: 500 }
            );
        }

        // If tenant with unit, update unit's current_tenant_id
        if (invitation.role === 'tenant' && invitation.unit_id) {
            await supabase
                .from('units')
                .update({
                    current_tenant_id: authUser.user.id,
                    is_occupied: true,
                })
                .eq('id', invitation.unit_id);
        }

        // If guard, create property assignment
        if (invitation.role === 'guard' && invitation.property_id) {
            await supabase
                .from('property_guards')
                .insert({
                    property_id: invitation.property_id,
                    guard_id: authUser.user.id,
                });
        }

        // Mark invitation as accepted
        await supabase
            .from('invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

        return NextResponse.json({
            success: true,
            message: 'Account created successfully! You can now log in.',
            user: {
                id: authUser.user.id,
                email: invitation.email,
                role: invitation.role,
            }
        });

    } catch (error) {
        console.error('Accept invitation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Validate invitation token
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        const { data: invitation, error } = await supabase
            .from('invitations')
            .select(`
                id,
                email,
                role,
                status,
                expires_at,
                full_name,
                phone_number,
                properties:property_id(id, name),
                units:unit_id(id, unit_number, rent_amount)
            `)
            .eq('token', token)
            .single();

        if (error || !invitation) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Check status
        if (invitation.status !== 'pending') {
            return NextResponse.json({
                valid: false,
                status: invitation.status,
                error: invitation.status === 'accepted'
                    ? 'This invitation has already been used.'
                    : 'This invitation is no longer valid.'
            });
        }

        // Check expiry
        if (new Date(invitation.expires_at) < new Date()) {
            return NextResponse.json({
                valid: false,
                status: 'expired',
                error: 'This invitation has expired.'
            });
        }

        return NextResponse.json({
            valid: true,
            invitation: {
                email: invitation.email,
                role: invitation.role,
                fullName: invitation.full_name,
                phoneNumber: invitation.phone_number,
                property: invitation.properties,
                unit: invitation.units,
            }
        });

    } catch (error) {
        console.error('Validate invitation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
