'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    History,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Calendar,
    User,
    Search,
} from 'lucide-react';

export default function GuardHistoryPage() {
    const [verifications, setVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const supabase = createClient();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('gate_passes')
            .select('*, units(unit_number, properties(name))')
            .eq('guard_id', user.id)
            .not('entry_time', 'is', null)
            .order('entry_time', { ascending: false })
            .limit(100);

        setVerifications(data || []);
        setLoading(false);
    };

    const filteredVerifications = verifications.filter(v => {
        if (filter === 'all') return true;
        return v.status === filter;
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
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Verification History</h1>
                <p className="text-slate-600 mt-1">View all past access verifications</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <History className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="text-xl font-bold text-slate-900">{verifications.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Approved</p>
                            <p className="text-xl font-bold text-slate-900">
                                {verifications.filter(v => v.status === 'used').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Denied</p>
                            <p className="text-xl font-bold text-slate-900">
                                {verifications.filter(v => v.failed_attempts > 0).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Today</p>
                            <p className="text-xl font-bold text-slate-900">
                                {verifications.filter(v => new Date(v.entry_time).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {['all', 'used', 'active', 'revoked'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* History List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {filteredVerifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <History className="mx-auto mb-3 text-slate-300" size={40} />
                        <p className="text-slate-500">No verification history yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredVerifications.map((v) => (
                            <div key={v.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${v.status === 'used' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                        {v.status === 'used' ? (
                                            <CheckCircle className="text-green-600" size={20} />
                                        ) : (
                                            <XCircle className="text-red-600" size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <p className="font-medium text-slate-900">{v.visitor_name || 'Unknown Visitor'}</p>
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            {v.units?.properties?.name} • Unit {v.units?.unit_number}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">
                                        {v.entry_time ? new Date(v.entry_time).toLocaleString() : '-'}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono">{v.access_code}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
