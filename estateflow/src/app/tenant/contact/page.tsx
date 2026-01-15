'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Phone,
    Mail,
    Building2,
    User,
    Loader2,
    MessageSquare,
} from 'lucide-react';

export default function ContactPage() {
    const [landlord, setLandlord] = useState<any>(null);
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get tenant's unit and property
        const { data: unitData } = await supabase
            .from('units')
            .select('*, properties(*)')
            .eq('current_tenant_id', user.id)
            .single();

        if (unitData?.properties) {
            setProperty(unitData.properties);

            // Get landlord info
            const { data: landlordData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', unitData.properties.landlord_id)
                .single();

            setLandlord(landlordData);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Contact Landlord</h1>
                <p className="text-slate-600 mt-1">Get in touch with your property manager</p>
            </div>

            {/* Property Info */}
            {property && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Building2 className="text-indigo-600" size={28} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">{property.name}</h3>
                            <p className="text-slate-500">{property.address}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Landlord Contact Card */}
            {landlord ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Property Manager</h3>
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {landlord.full_name?.charAt(0) || 'L'}
                        </div>
                        <div>
                            <p className="font-semibold text-lg text-slate-900">{landlord.full_name || 'Landlord'}</p>
                            <p className="text-slate-500">Property Manager</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {landlord.phone_number && (
                            <a
                                href={`tel:${landlord.phone_number}`}
                                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Phone className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Phone</p>
                                    <p className="font-medium text-slate-900">{landlord.phone_number}</p>
                                </div>
                            </a>
                        )}

                        <a
                            href={`mailto:landlord@estateflow.com`}
                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Mail className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="font-medium text-slate-900">landlord@property.com</p>
                            </div>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <User className="mx-auto mb-3 text-slate-300" size={40} />
                    <p className="text-slate-500">Landlord contact information not available</p>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                        href="/tenant/maintenance"
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Report Issue</p>
                            <p className="text-sm text-slate-500">Submit maintenance request</p>
                        </div>
                    </a>
                    <a
                        href="/tenant/payments"
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Mail className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Payment Inquiry</p>
                            <p className="text-sm text-slate-500">Questions about billing</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
