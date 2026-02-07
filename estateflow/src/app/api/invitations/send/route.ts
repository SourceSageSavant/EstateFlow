import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user (must be landlord)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get landlord profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'landlord') {
            return NextResponse.json({ error: 'Only landlords can send invitations' }, { status: 403 });
        }

        const body = await request.json();
        const { email, role, propertyId, unitId, fullName, phoneNumber } = body;

        // Validate required fields
        if (!email || !role || !propertyId) {
            return NextResponse.json(
                { error: 'Missing required fields: email, role, propertyId' },
                { status: 400 }
            );
        }

        // Validate role
        if (!['tenant', 'guard'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be tenant or guard' },
                { status: 400 }
            );
        }

        // Verify property belongs to landlord
        const { data: property } = await supabase
            .from('properties')
            .select('id, name, owner_id, landlord_id')
            .eq('id', propertyId)
            .single();

        if (!property || (property.owner_id !== user.id && property.landlord_id !== user.id)) {
            return NextResponse.json(
                { error: 'Property not found or access denied' },
                { status: 404 }
            );
        }

        // Check if user already exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .single();

        if (existingProfile) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            );
        }

        // Check for pending invitation
        const { data: existingInvite } = await supabase
            .from('invitations')
            .select('id, status')
            .eq('email', email)
            .eq('status', 'pending')
            .single();

        if (existingInvite) {
            return NextResponse.json(
                { error: 'A pending invitation already exists for this email' },
                { status: 409 }
            );
        }

        // Generate unique token
        const token = randomBytes(32).toString('hex');

        // Create invitation record
        // @ts-ignore - database types may not include invitations yet
        const { data: invitation, error: insertError } = await supabase
            .from('invitations')
            .insert({
                email,
                role,
                property_id: propertyId,
                unit_id: unitId || null,
                invited_by: user.id,
                token,
                full_name: fullName || null,
                phone_number: phoneNumber || null,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create invitation:', insertError);
            return NextResponse.json(
                { error: 'Failed to create invitation' },
                { status: 500 }
            );
        }

        // Send invitation email using Supabase Auth
        // The user will receive an email with the invite link
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;

        // Use Supabase's invite functionality (creates auth user + sends email)
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
            redirectTo: inviteUrl,
            data: {
                role: role,
                invitation_token: token,
                property_id: propertyId,
                unit_id: unitId,
            }
        });

        // If admin invite fails (e.g., no admin key), we'll handle it gracefully
        // The landlord can share the link manually
        if (inviteError) {
            console.warn('Admin invite failed (this is OK on free tier):', inviteError.message);
            // Return the invite link so landlord can share manually
            return NextResponse.json({
                success: true,
                invitation: {
                    id: invitation.id,
                    email,
                    role,
                    token,
                    inviteUrl,
                },
                message: 'Invitation created. Share this link with the invitee.',
                manualShare: true,
            });
        }

        return NextResponse.json({
            success: true,
            invitation: {
                id: invitation.id,
                email,
                role,
            },
            message: 'Invitation email sent successfully',
        });

    } catch (error) {
        console.error('Send invitation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - List invitations for current landlord
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get('propertyId');
        const status = searchParams.get('status');

        let query = supabase
            .from('invitations')
            .select(`
                *,
                properties:property_id(name),
                units:unit_id(unit_number)
            `)
            .eq('invited_by', user.id)
            .order('created_at', { ascending: false });

        if (propertyId) {
            query = query.eq('property_id', propertyId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        // @ts-ignore
        const { data: invitations, error } = await query;

        if (error) {
            console.error('Failed to fetch invitations:', error);
            return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
        }

        return NextResponse.json({ invitations });

    } catch (error) {
        console.error('Get invitations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
