import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
    generateReminderMessage,
    generateOverdueMessage,
    generateWhatsAppLink,
    ReminderData,
} from '@/lib/whatsapp';

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

        // Get current user (landlord)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get landlord profile
        const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();

        if (!landlordProfile || landlordProfile.role !== 'landlord') {
            return NextResponse.json({ error: 'Only landlords can send reminders' }, { status: 403 });
        }

        // Get request body
        const body = await request.json();
        const { tenantId, unitId, type = 'reminder' } = body;

        if (!tenantId || !unitId) {
            return NextResponse.json(
                { error: 'Tenant ID and Unit ID are required' },
                { status: 400 }
            );
        }

        // Get tenant info
        const { data: tenant, error: tenantError } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', tenantId)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        if (!tenant.phone_number) {
            return NextResponse.json(
                { error: 'Tenant does not have a phone number' },
                { status: 400 }
            );
        }

        // Get unit and property info
        const { data: unit, error: unitError } = await supabase
            .from('units')
            .select('unit_number, rent_amount, rent_due_day, properties(name, landlord_id)')
            .eq('id', unitId)
            .single();

        if (unitError || !unit) {
            return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
        }

        // Verify landlord owns this property
        if (unit.properties?.landlord_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized for this property' }, { status: 403 });
        }

        // Calculate due date
        const today = new Date();
        const dueDay = unit.rent_due_day || 1;
        let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

        // If due date already passed this month, it's for this month
        // If not, could be for next month depending on when reminder is sent
        const dueDateStr = dueDate.toLocaleDateString('en-KE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // Build reminder data
        const reminderData: ReminderData = {
            tenantName: tenant.full_name || 'Tenant',
            tenantPhone: tenant.phone_number,
            amount: unit.rent_amount,
            propertyName: unit.properties?.name || 'Property',
            unitNumber: unit.unit_number,
            dueDate: dueDateStr,
            landlordName: landlordProfile.full_name || 'Management',
            // These would come from property settings
            paybill: undefined,
            accountNumber: unit.unit_number,
        };

        // Generate message based on type
        let message: string;
        if (type === 'overdue') {
            // Calculate days overdue
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            message = generateOverdueMessage({ ...reminderData, daysOverdue: Math.max(daysOverdue, 1) });
        } else {
            message = generateReminderMessage(reminderData);
        }

        // Generate WhatsApp link
        const whatsappLink = generateWhatsAppLink(tenant.phone_number, message);

        return NextResponse.json({
            success: true,
            whatsappLink,
            message,
            tenant: {
                name: tenant.full_name,
                phone: tenant.phone_number,
            },
        });

    } catch (error) {
        console.error('WhatsApp reminder error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
