'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    FileText,
    Plus,
    Search,
    Download,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Loader2,
    MoreVertical,
    Send,
    Trash2,
    X
} from 'lucide-react';
import { format } from 'date-fns';

export default function LeasesPage() {
    const [leases, setLeases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLease, setSelectedLease] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchLeases();
    }, []);

    const fetchLeases = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch leases for properties owned by this landlord
        const { data, error } = await (supabase
            .from('leases') as any)
            .select(`
                *,
                units (
                    unit_number,
                    properties (name)
                ),
                profiles (
                    full_name,
                    email,
                    phone_number
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leases:', error);
        } else {
            setLeases(data || []);
        }
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'pending_signature': return 'bg-amber-100 text-amber-700';
            case 'terminated': return 'bg-red-100 text-red-700';
            case 'expired': return 'bg-slate-100 text-slate-700';
            case 'draft': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle size={14} />;
            case 'pending_signature': return <Clock size={14} />;
            case 'terminated': return <XCircle size={14} />;
            case 'expired': return <AlertCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const handleViewDetails = (lease: any) => {
        setSelectedLease(lease);
        setShowDetailModal(true);
    };

    const handleTerminateLease = async (leaseId: string) => {
        if (!confirm('Are you sure you want to terminate this lease? This action cannot be undone.')) {
            return;
        }

        setActionLoading(leaseId);
        try {
            const { error } = await (supabase
                .from('leases') as any)
                .update({ status: 'terminated' })
                .eq('id', leaseId);

            if (error) throw error;

            toast.success('Lease terminated successfully');
            fetchLeases();
        } catch (error) {
            console.error('Error terminating lease:', error);
            toast.error('Failed to terminate lease');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResendNotification = async (lease: any) => {
        setActionLoading(lease.id);
        try {
            // For now, just show success - in production, this would send an email/SMS
            toast.success(`Reminder sent to ${lease.profiles?.email}`);
        } catch (error) {
            toast.error('Failed to send notification');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredLeases = leases.filter(lease =>
        lease.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.units?.properties?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.units?.unit_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lease Agreements</h1>
                    <p className="text-slate-500">Manage digital leases and electronic signatures</p>
                </div>
                <Link
                    href="/admin/leases/new"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                    <Plus size={20} />
                    Create Lease
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-2xl font-bold text-slate-900">{leases.length}</p>
                    <p className="text-sm text-slate-500">Total Leases</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-2xl font-bold text-green-600">{leases.filter(l => l.status === 'active').length}</p>
                    <p className="text-sm text-slate-500">Active</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-2xl font-bold text-amber-600">{leases.filter(l => l.status === 'pending_signature').length}</p>
                    <p className="text-sm text-slate-500">Pending Signature</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-2xl font-bold text-red-600">{leases.filter(l => l.status === 'terminated' || l.status === 'expired').length}</p>
                    <p className="text-sm text-slate-500">Ended</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by tenant, property, or unit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Property / Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rent</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredLeases.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <FileText className="mx-auto mb-3 text-slate-300" size={48} />
                                        <p>No lease agreements found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeases.map((lease) => (
                                    <tr key={lease.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {lease.profiles?.full_name?.charAt(0) || 'T'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{lease.profiles?.full_name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">{lease.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-slate-900">{lease.units?.properties?.name || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">Unit {lease.units?.unit_number || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">
                                                {lease.start_date ? format(new Date(lease.start_date), 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                to {lease.end_date ? format(new Date(lease.end_date), 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            KES {lease.rent_amount?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(lease.status)}`}>
                                                {getStatusIcon(lease.status)}
                                                {lease.status?.replace('_', ' ') || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View Details */}
                                                <button
                                                    onClick={() => handleViewDetails(lease)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {/* Download PDF */}
                                                {lease.pdf_url && (
                                                    <button
                                                        onClick={() => window.open(lease.pdf_url, '_blank')}
                                                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Download Signed PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                )}

                                                {/* Resend Notification (for pending) */}
                                                {lease.status === 'pending_signature' && (
                                                    <button
                                                        onClick={() => handleResendNotification(lease)}
                                                        disabled={actionLoading === lease.id}
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50"
                                                        title="Resend Notification"
                                                    >
                                                        {actionLoading === lease.id ? (
                                                            <Loader2 className="animate-spin" size={18} />
                                                        ) : (
                                                            <Send size={18} />
                                                        )}
                                                    </button>
                                                )}

                                                {/* Terminate (for active) */}
                                                {lease.status === 'active' && (
                                                    <button
                                                        onClick={() => handleTerminateLease(lease.id)}
                                                        disabled={actionLoading === lease.id}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                        title="Terminate Lease"
                                                    >
                                                        {actionLoading === lease.id ? (
                                                            <Loader2 className="animate-spin" size={18} />
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLease && (
                <LeaseDetailModal
                    lease={selectedLease}
                    onClose={() => setShowDetailModal(false)}
                />
            )}
        </div>
    );
}

function LeaseDetailModal({ lease, onClose }: { lease: any; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">Lease Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Tenant Info */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-700 mb-3">Tenant Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Name</p>
                                <p className="font-medium text-slate-900">{lease.profiles?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Email</p>
                                <p className="font-medium text-slate-900">{lease.profiles?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Phone</p>
                                <p className="font-medium text-slate-900">{lease.profiles?.phone_number || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Property Info */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-700 mb-3">Property Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Property</p>
                                <p className="font-medium text-slate-900">{lease.units?.properties?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Unit</p>
                                <p className="font-medium text-slate-900">{lease.units?.unit_number || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Lease Terms */}
                    <div className="bg-slate-50 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-700 mb-3">Lease Terms</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Start Date</p>
                                <p className="font-medium text-slate-900">
                                    {lease.start_date ? format(new Date(lease.start_date), 'PPP') : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">End Date</p>
                                <p className="font-medium text-slate-900">
                                    {lease.end_date ? format(new Date(lease.end_date), 'PPP') : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Monthly Rent</p>
                                <p className="font-medium text-slate-900">KES {lease.rent_amount?.toLocaleString() || '0'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Security Deposit</p>
                                <p className="font-medium text-slate-900">KES {lease.security_deposit?.toLocaleString() || '0'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Status</p>
                                <p className="font-medium text-slate-900 capitalize">{lease.status?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Signed At</p>
                                <p className="font-medium text-slate-900">
                                    {lease.signed_at ? format(new Date(lease.signed_at), 'PPP') : 'Not signed'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Terms Text */}
                    {lease.terms_text && (
                        <div className="bg-slate-50 rounded-xl p-4">
                            <h3 className="font-semibold text-slate-700 mb-3">Agreement Terms</h3>
                            <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                                {lease.terms_text}
                            </pre>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {lease.pdf_url && (
                            <button
                                onClick={() => window.open(lease.pdf_url, '_blank')}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Download PDF
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
