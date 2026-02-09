'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
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
    MessageCircle,
    Send,
    X,
    Users,
    ExternalLink,
} from 'lucide-react';

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

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, failed: 0 });

    // Bulk reminder state
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [reminders, setReminders] = useState<TenantReminder[]>([]);
    const [reminderType, setReminderType] = useState<'reminder' | 'overdue'>('reminder');
    const [skippedTenants, setSkippedTenants] = useState<{ name: string; reason: string }[]>([]);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Get properties owned by this landlord
        const { data: propertyData } = await supabase
            .from('properties')
            .select('id')
            .eq('landlord_id', user.id);

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
                const { data: paymentData } = await (supabase
                    .from('payment_transactions') as any)
                    .select('*, units(unit_number, properties(name)), profiles(full_name)')
                    .in('unit_id', unitIds)
                    .order('created_at', { ascending: false });

                setPayments(paymentData || []);

                // Calculate stats
                const totalAmount = (paymentData || [])
                    .filter((p: any) => p.status === 'completed')
                    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                const completed = (paymentData || []).filter((p: any) => p.status === 'completed').length;
                const pending = (paymentData || []).filter((p: any) => p.status === 'pending').length;
                const failed = (paymentData || []).filter((p: any) => p.status === 'failed').length;

                setStats({ total: totalAmount, completed, pending, failed });
            }
        }

        setLoading(false);
    };

    const fetchBulkReminders = async () => {
        setBulkLoading(true);
        try {
            const response = await fetch('/api/whatsapp/bulk-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: reminderType }),
            });

            const data = await response.json();

            if (data.success) {
                setReminders(data.reminders || []);
                setSkippedTenants(data.skipped || []);
                if (data.reminders?.length === 0) {
                    toast('No tenants found to send reminders', { icon: '📭' });
                }
            } else {
                toast.error(data.error || 'Failed to fetch tenants');
            }
        } catch (error) {
            toast.error('Failed to fetch tenants');
        } finally {
            setBulkLoading(false);
        }
    };

    const openBulkReminders = () => {
        setShowBulkModal(true);
        fetchBulkReminders();
    };

    const handleSendAll = () => {
        if (reminders.length === 0) {
            toast.error('No reminders to send');
            return;
        }

        // Open WhatsApp links (with a delay between each to prevent browser blocking)
        let delay = 0;
        reminders.forEach((reminder, index) => {
            setTimeout(() => {
                window.open(reminder.whatsappLink, '_blank');
            }, delay);
            delay += 800; // 800ms delay between each
        });

        toast.success(`Opening ${reminders.length} WhatsApp messages...`);
    };

    const handleSendOne = (reminder: TenantReminder) => {
        window.open(reminder.whatsappLink, '_blank');
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            payment.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.units?.properties?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} />Completed</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock size={12} />Pending</span>;
            case 'failed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} />Failed</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
        }
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
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Payments</h1>
                    <p className="text-slate-600 mt-1">Track and manage rent payments</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openBulkReminders}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        <MessageCircle size={20} />
                        <span>Send Reminders</span>
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                        <Download size={20} />
                        <span>Export</span>
                    </button>
                </div>
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <CreditCard className="mx-auto mb-3 text-slate-300" size={48} />
                                        <p>No payments found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-medium text-slate-900">{payment.profiles?.full_name || 'Unknown'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-slate-900">{payment.units?.properties?.name || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">Unit {payment.units?.unit_number || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-medium text-slate-900">KES {payment.amount?.toLocaleString() || '0'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {payment.created_at
                                                ? new Date(payment.created_at).toLocaleDateString()
                                                : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Reminder Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Send Bulk Reminders</h2>
                                <p className="text-sm text-slate-500 mt-1">Send rent reminders to all tenants via WhatsApp</p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Type Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Message Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="reminder"
                                            checked={reminderType === 'reminder'}
                                            onChange={() => setReminderType('reminder')}
                                            className="text-indigo-600"
                                        />
                                        <span className="text-slate-700">Friendly Reminder</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="overdue"
                                            checked={reminderType === 'overdue'}
                                            onChange={() => setReminderType('overdue')}
                                            className="text-indigo-600"
                                        />
                                        <span className="text-slate-700">Overdue Notice</span>
                                    </label>
                                </div>
                                <button
                                    onClick={fetchBulkReminders}
                                    disabled={bulkLoading}
                                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    {bulkLoading ? 'Loading...' : 'Refresh List'}
                                </button>
                            </div>

                            {/* Tenant List */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-slate-900">Tenants ({reminders.length})</h3>
                                    {reminders.length > 0 && (
                                        <span className="text-xs text-slate-500">Click to preview message</span>
                                    )}
                                </div>

                                {bulkLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                                    </div>
                                ) : reminders.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <Users className="mx-auto mb-2 text-slate-300" size={40} />
                                        <p>No tenants with phone numbers found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {reminders.map((reminder) => (
                                            <div
                                                key={reminder.tenantId}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                                                onClick={() => handleSendOne(reminder)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                                                        {reminder.tenantName?.charAt(0) || 'T'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{reminder.tenantName}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {reminder.propertyName} • Unit {reminder.unitNumber} • KES {reminder.rentAmount?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ExternalLink size={16} className="text-slate-400" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Skipped Tenants */}
                            {skippedTenants.length > 0 && (
                                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <p className="text-sm font-medium text-amber-800 mb-1">Skipped ({skippedTenants.length})</p>
                                    <div className="text-xs text-amber-700 space-y-1">
                                        {skippedTenants.slice(0, 5).map((t, i) => (
                                            <p key={i}>{t.name}: {t.reason}</p>
                                        ))}
                                        {skippedTenants.length > 5 && (
                                            <p>...and {skippedTenants.length - 5} more</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSendAll}
                                    disabled={reminders.length === 0 || bulkLoading}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Send size={20} />
                                    Send All ({reminders.length})
                                </button>
                                <button
                                    onClick={() => setShowBulkModal(false)}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-100"
                                >
                                    Close
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-3">
                                Opens WhatsApp for each tenant. Allow popups for bulk send.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
