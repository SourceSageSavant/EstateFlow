import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
    generateReminderMessage,
    generateOverdueMessage,
    generateWhatsAppLink,
    ReminderData,
} from '@/lib/whatsapp';

interface TenantReminder {
    tenantId: string;
    tenantName: string;
    tenantPhone: string;
    propertyName: string;
    unitNumber: string;
    rentAmount: number;
    whatsappLink: string;
    message: string;
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
        const { propertyId, type = 'reminder' } = body;

        // Get landlord's properties
        let propertiesQuery = supabase
            .from('properties')
            .select('id, name')
            .eq('landlord_id', user.id);

        if (propertyId) {
            propertiesQuery = propertiesQuery.eq('id', propertyId);
        }

        const { data: properties, error: propsError } = await propertiesQuery;

        if (propsError || !properties?.length) {
            return NextResponse.json({ error: 'No properties found' }, { status: 404 });
        }

        const propertyIds = properties.map(p => p.id);
        const propertyMap = Object.fromEntries(properties.map(p => [p.id, p.name]));

        // Get all units for these properties with current tenants
        const { data: units, error: unitsError } = await supabase
            .from('units')
            .select('id, unit_number, rent_amount, rent_due_day, property_id, current_tenant_id')
            .in('property_id', propertyIds)
            .not('current_tenant_id', 'is', null);

        if (unitsError || !units?.length) {
            return NextResponse.json({
                success: true,
                message: 'No tenants found in your properties',
                reminders: []
            });
        }

        // Get tenant profiles
        const tenantIds = units.map(u => u.current_tenant_id).filter(Boolean);
        const { data: tenants, error: tenantsError } = await supabase
            .from('profiles')
            .select('id, full_name, phone_number')
            .in('id', tenantIds);

        if (tenantsError) {
            return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
        }

        const tenantMap = Object.fromEntries((tenants || []).map(t => [t.id, t]));

        // Calculate due date
        const today = new Date();
        const defaultDueDay = 1;

        // Build reminders for each tenant
        const reminders: TenantReminder[] = [];
        const skipped: { name: string; reason: string }[] = [];

        for (const unit of units) {
            const tenant = tenantMap[unit.current_tenant_id];

            if (!tenant) {
                continue;
            }

            if (!tenant.phone_number) {
                skipped.push({
                    name: tenant.full_name || 'Unknown',
                    reason: 'No phone number'
                });
                continue;
            }

            const dueDay = unit.rent_due_day || defaultDueDay;
            const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            const dueDateStr = dueDate.toLocaleDateString('en-KE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            const reminderData: ReminderData = {
                tenantName: tenant.full_name || 'Tenant',
                tenantPhone: tenant.phone_number,
                amount: unit.rent_amount,
                propertyName: propertyMap[unit.property_id] || 'Property',
                unitNumber: unit.unit_number,
                dueDate: dueDateStr,
                landlordName: landlordProfile.full_name || 'Management',
                paybill: undefined,
                accountNumber: unit.unit_number,
            };

            let message: string;
            if (type === 'overdue') {
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                message = generateOverdueMessage({ ...reminderData, daysOverdue: Math.max(daysOverdue, 1) });
            } else {
                message = generateReminderMessage(reminderData);
            }

            const whatsappLink = generateWhatsAppLink(tenant.phone_number, message);

            reminders.push({
                tenantId: tenant.id,
                tenantName: tenant.full_name || 'Tenant',
                tenantPhone: tenant.phone_number,
                propertyName: propertyMap[unit.property_id] || 'Property',
                unitNumber: unit.unit_number,
                rentAmount: unit.rent_amount,
                whatsappLink,
                message,
            });
        }

        return NextResponse.json({
            success: true,
            totalTenants: reminders.length,
            skipped,
            reminders,
        });

    } catch (error) {
        console.error('Bulk reminder error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
