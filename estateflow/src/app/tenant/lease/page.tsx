'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    FileText,
    Calendar,
    Home,
    DollarSign,
    Loader2,
    User,
    Clock,
} from 'lucide-react';

export default function LeasePage() {
    const [unit, setUnit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('units')
            .select('*, properties(name, address)')
            .eq('current_tenant_id', user.id)
            .single();

        setUnit(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!unit) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <FileText className="mx-auto mb-3 text-slate-300" size={40} />
                <h2 className="text-lg font-semibold text-slate-900">No Lease Found</h2>
                <p className="text-slate-500 mt-1">You are not currently assigned to a unit</p>
            </div>
        );
    }

    const leaseStart = unit.lease_start ? new Date(unit.lease_start) : null;
    const leaseEnd = unit.lease_end ? new Date(unit.lease_end) : null;
    const daysRemaining = leaseEnd ? Math.ceil((leaseEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Lease Information</h1>
                <p className="text-slate-600 mt-1">Your rental agreement details</p>
            </div>

            {/* Unit Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Home className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Property</p>
                            <p className="font-medium text-slate-900">{unit.properties?.name}</p>
                            <p className="text-sm text-slate-600">{unit.properties?.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <User className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Unit</p>
                            <p className="font-medium text-slate-900">Unit {unit.unit_number}</p>
                            <p className="text-sm text-slate-600">
                                Status: <span className="text-green-600 capitalize">{unit.status}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lease Terms */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Lease Terms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <DollarSign className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Monthly Rent</p>
                            <p className="text-xl font-bold text-slate-900">KES {unit.rent_amount?.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Due on day {unit.rent_due_day || 1}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Calendar className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Lease Period</p>
                            <p className="font-medium text-slate-900">
                                {leaseStart ? leaseStart.toLocaleDateString() : 'Not set'}
                            </p>
                            <p className="text-sm text-slate-600">
                                to {leaseEnd ? leaseEnd.toLocaleDateString() : 'Not set'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Clock className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Time Remaining</p>
                            {daysRemaining !== null ? (
                                <>
                                    <p className="text-xl font-bold text-slate-900">{daysRemaining} days</p>
                                    <p className="text-xs text-slate-500">
                                        {daysRemaining <= 30 ? 'Expiring soon!' : 'Until lease ends'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-slate-500">Not specified</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-semibold text-amber-800 mb-2">Important Reminders</h3>
                <ul className="text-sm text-amber-700 space-y-2">
                    <li>• Rent is due on day {unit.rent_due_day || 1} of each month</li>
                    <li>• Late payment may incur additional charges</li>
                    <li>• Contact your landlord for any lease modifications</li>
                    <li>• Provide 30 days notice before moving out</li>
                </ul>
            </div>
        </div>
    );
}
