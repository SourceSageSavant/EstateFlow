'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
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
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function LeasesPage() {
    const [leases, setLeases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchLeases();
    }, []);

    const fetchLeases = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch leases for properties owned by this landlord
        // Joined with units and tenants
        const { data, error } = await supabase
            .from('leases')
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
            default: return 'bg-slate-100 text-slate-700';
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
                                                    <p className="font-medium text-slate-900">{lease.profiles?.full_name}</p>
                                                    <p className="text-xs text-slate-500">{lease.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm text-slate-900">{lease.units?.properties?.name}</p>
                                            <p className="text-xs text-slate-500">Unit {lease.units?.unit_number}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">
                                                {format(new Date(lease.start_date), 'MMM d, yyyy')}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                to {format(new Date(lease.end_date), 'MMM d, yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            KES {lease.rent_amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(lease.status)}`}>
                                                {lease.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {lease.pdf_url && (
                                                    <button
                                                        onClick={() => window.open(lease.pdf_url, '_blank')}
                                                        className="text-slate-400 hover:text-indigo-600"
                                                        title="Download Signed PDF"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                )}
                                                {/* Edit/View button could go here */}
                                            </div>
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
