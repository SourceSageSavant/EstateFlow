'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    CreditCard,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    DollarSign,
    AlertCircle,
    Smartphone,
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

export default function TenantPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [unit, setUnit] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile for phone number
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(profileData);

        // Get unit info
        const { data: unitData } = await supabase
            .from('units')
            .select('*, properties(id, name)')
            .eq('current_tenant_id', user.id)
            .single();

        setUnit(unitData);

        // Get payments
        const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('tenant_id', user.id)
            .order('created_at', { ascending: false });

        setPayments(paymentData || []);
        setLoading(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return <CheckCircle className="text-green-600" size={20} />;
            case 'pending': return <Clock className="text-amber-600" size={20} />;
            case 'failed': return <XCircle className="text-red-600" size={20} />;
            default: return <AlertCircle className="text-slate-400" size={20} />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    // Get current payment period (e.g., "2026-02")
    const getCurrentPaymentPeriod = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const handlePaymentComplete = () => {
        setShowPaymentModal(false);
        // Refresh payment data
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const totalPaid = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
                <p className="text-slate-600 mt-1">View your payment history and upcoming dues</p>
            </div>

            {/* Current Rent Info */}
            {unit && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-indigo-200 text-sm">Current Monthly Rent</p>
                            <p className="text-3xl font-bold">KES {unit.rent_amount?.toLocaleString()}</p>
                            <p className="text-indigo-200 text-sm mt-1">
                                {unit.properties?.name} • Unit {unit.unit_number}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-indigo-200 text-sm">Due Date</p>
                            <p className="text-xl font-semibold">Day {unit.rent_due_day || 1} of each month</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Paid</p>
                            <p className="text-xl font-bold text-slate-900">KES {totalPaid.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Payments Made</p>
                            <p className="text-xl font-bold text-slate-900">{payments.filter(p => p.status === 'verified').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Pending</p>
                            <p className="text-xl font-bold text-slate-900">{payments.filter(p => p.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Make Payment Button */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                            <Smartphone className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Ready to pay your rent?</h3>
                            <p className="text-slate-600 text-sm">Pay securely via M-Pesa STK Push</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={!unit}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <Smartphone size={20} />
                        Pay with M-Pesa
                    </button>
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">Payment History</h3>
                </div>
                {payments.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard className="mx-auto mb-3 text-slate-300" size={40} />
                        <p className="text-slate-500">No payment history yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {payments.map((payment) => (
                            <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(payment.status)}
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            KES {payment.amount?.toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar size={14} />
                                            <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{payment.month_paid_for}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusBadge(payment.status)}`}>
                                    {payment.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {unit && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={handlePaymentComplete}
                    propertyId={unit.properties?.id || unit.property_id}
                    unitId={unit.id}
                    amount={unit.rent_amount || 0}
                    paymentPeriod={getCurrentPaymentPeriod()}
                    tenantPhone={profile?.phone_number || ''}
                />
            )}
        </div>
    );
}

