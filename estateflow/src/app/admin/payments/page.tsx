'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    CreditCard,
    Search,
    Download,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Filter,
    Calendar,
} from 'lucide-react';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, failed: 0 });
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get properties owned by this landlord
        const { data: propertyData } = await supabase
            .from('properties')
            .select('id')
            .eq('owner_id', user.id);

        if (propertyData && propertyData.length > 0) {
            const propertyIds = propertyData.map(p => p.id);

            // Get units in those properties
            const { data: unitData } = await supabase
                .from('units')
                .select('id')
                .in('property_id', propertyIds);

            if (unitData && unitData.length > 0) {
                const unitIds = unitData.map(u => u.id);

                // Get payments for those units
                const { data: paymentData } = await supabase
                    .from('payments')
                    .select('*, units(unit_number, properties(name)), profiles(full_name)')
                    .in('unit_id', unitIds)
                    .order('created_at', { ascending: false });

                setPayments(paymentData || []);

                // Calculate stats
                const totalAmount = (paymentData || [])
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                const completed = (paymentData || []).filter(p => p.status === 'completed').length;
                const pending = (paymentData || []).filter(p => p.status === 'pending').length;
                const failed = (paymentData || []).filter(p => p.status === 'failed').length;

                setStats({ total: totalAmount, completed, pending, failed });
            }
        }

        setLoading(false);
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            payment.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.units?.properties?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Payments</h1>
                    <p className="text-slate-600 mt-1">Track and manage rent payments</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                    <Download size={20} />
                    <span>Export</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-slate-900">KES {stats.total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Completed</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Clock className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Pending</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <XCircle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Failed</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.failed}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by tenant, property, or reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Tenant</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500 hidden sm:table-cell">Property / Unit</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Amount</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500 hidden md:table-cell">Date</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <CreditCard className="mx-auto mb-3 text-slate-300" size={40} />
                                        <p>No payments found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900">{payment.profiles?.full_name || 'Unknown'}</p>
                                                <p className="text-sm text-slate-500 sm:hidden">
                                                    {payment.units?.properties?.name} - {payment.units?.unit_number}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <p className="text-slate-900">{payment.units?.properties?.name}</p>
                                            <p className="text-sm text-slate-500">Unit {payment.units?.unit_number}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-900">KES {payment.amount?.toLocaleString()}</p>
                                            <p className="text-xs text-slate-500 capitalize">{payment.payment_method || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar size={14} />
                                                <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
