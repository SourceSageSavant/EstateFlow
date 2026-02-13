import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Haversine formula to calculate distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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

        // Get the pass and associated property
        const { data: pass, error: passError } = await supabase
            .from('gate_passes')
            .select(`
                *,
                properties (
                    id,
                    name,
                    latitude,
                    longitude,
                    geofence_radius
                )
            `)
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

        // Geofencing Check
        // If property has coordinates (geofencing enabled), location is REQUIRED
        const propertyHasGeofence = pass.properties?.latitude && pass.properties?.longitude;

        if (propertyHasGeofence && (!location?.latitude || !location?.longitude)) {
            return NextResponse.json({
                error: 'Location is required for check-in at this property. Please enable location services.',
            }, { status: 400 });
        }

        if (propertyHasGeofence && location?.latitude && location?.longitude) {
            const distance = getDistanceInMeters(
                location.latitude,
                location.longitude,
                pass.properties.latitude,
                pass.properties.longitude
            );

            const radius = pass.properties.geofence_radius || 100; // Default 100m

            if (distance > radius) {
                return NextResponse.json({
                    error: `You are too far from the gate (${Math.round(distance)}m away). Max allowed: ${radius}m.`
                }, { status: 403 });
            }
        }

        // Update pass to checked in
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
