'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Wrench,
    Search,
    Clock,
    CheckCircle,
    AlertTriangle,
    Loader2,
    MessageSquare,
    User,
    Building,
    ChevronRight,
    X,
    Send,
} from 'lucide-react';

export default function MaintenancePage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get properties owned by landlord
        const { data: propertyData } = await supabase
            .from('properties')
            .select('id')
            .eq('owner_id', user.id);

        if (propertyData && propertyData.length > 0) {
            const propertyIds = propertyData.map(p => p.id);

            // Get units
            const { data: unitData } = await supabase
                .from('units')
                .select('id')
                .in('property_id', propertyIds);

            if (unitData && unitData.length > 0) {
                const unitIds = unitData.map(u => u.id);

                // Get maintenance requests
                const { data: requestData } = await supabase
                    .from('maintenance_requests')
                    .select('*, units(unit_number, properties(name)), profiles(full_name)')
                    .in('unit_id', unitIds)
                    .order('created_at', { ascending: false });

                setRequests(requestData || []);
            }
        }

        setLoading(false);
    };

    const updateStatus = async (requestId: string, newStatus: string) => {
        await supabase
            .from('maintenance_requests')
            .update({ status: newStatus })
            .eq('id', requestId);

        setRequests(requests.map(r =>
            r.id === requestId ? { ...r, status: newStatus } : r
        ));
        setSelectedRequest(null);
    };

    const filteredRequests = requests.filter(request => {
        const matchesSearch =
            request.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        inProgress: requests.filter(r => ['acknowledged', 'scheduled', 'in_progress'].includes(r.status)).length,
        completed: requests.filter(r => r.status === 'completed').length,
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
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Maintenance</h1>
                <p className="text-slate-600 mt-1">Manage maintenance requests from tenants</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Wrench className="text-slate-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Pending</p>
                            <p className="text-xl font-bold text-slate-900">{stats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">In Progress</p>
                            <p className="text-xl font-bold text-slate-900">{stats.inProgress}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Completed</p>
                            <p className="text-xl font-bold text-slate-900">{stats.completed}</p>
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
                        placeholder="Search requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl bg-white"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {filteredRequests.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">
                            <Wrench className="mx-auto mb-3 text-slate-300" size={40} />
                            <p>No maintenance requests found</p>
                        </div>
                    ) : (
                        filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                onClick={() => setSelectedRequest(request)}
                                className="p-4 sm:p-6 hover:bg-slate-50 cursor-pointer flex items-center gap-4"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${request.priority === 'emergency' ? 'bg-red-100' :
                                        request.priority === 'high' ? 'bg-amber-100' : 'bg-slate-100'
                                    }`}>
                                    <Wrench className={
                                        request.priority === 'emergency' ? 'text-red-600' :
                                            request.priority === 'high' ? 'text-amber-600' : 'text-slate-600'
                                    } size={20} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-900 capitalize">{request.category}</p>
                                        {request.priority === 'emergency' && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">URGENT</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">{request.description}</p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <User size={12} />
                                            {request.profiles?.full_name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Building size={12} />
                                            {request.units?.properties?.name} - {request.units?.unit_number}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            request.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                        }`}>
                                        {request.status.replace('_', ' ')}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <ChevronRight className="text-slate-300 hidden sm:block" size={20} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                <RequestDetailModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdateStatus={updateStatus}
                />
            )}
        </div>
    );
}

function RequestDetailModal({ request, onClose, onUpdateStatus }: { request: any; onClose: () => void; onUpdateStatus: (id: string, status: string) => void }) {
    const [notes, setNotes] = useState(request.landlord_notes || '');
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    const saveNotes = async () => {
        setSaving(true);
        await supabase
            .from('maintenance_requests')
            .update({ landlord_notes: notes })
            .eq('id', request.id);
        setSaving(false);
    };

    const statusOptions = [
        { value: 'pending', label: 'Pending', color: 'bg-amber-500' },
        { value: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-500' },
        { value: 'scheduled', label: 'Scheduled', color: 'bg-purple-500' },
        { value: 'in_progress', label: 'In Progress', color: 'bg-indigo-500' },
        { value: 'completed', label: 'Completed', color: 'bg-green-500' },
        { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-900 capitalize">{request.category} Issue</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Details */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Description</p>
                            <p className="text-slate-900">{request.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Tenant</p>
                                <p className="text-slate-900">{request.profiles?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Unit</p>
                                <p className="text-slate-900">{request.units?.properties?.name} - {request.units?.unit_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Priority</p>
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${request.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                                        request.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-700'
                                    }`}>
                                    {request.priority}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Submitted</p>
                                <p className="text-slate-900">{new Date(request.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Status Update */}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Update Status</p>
                        <div className="grid grid-cols-3 gap-2">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => onUpdateStatus(request.id, option.value)}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${request.status === option.value
                                            ? `${option.color} text-white`
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Internal Notes</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this request..."
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none"
                        />
                        <button
                            onClick={saveNotes}
                            disabled={saving}
                            className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Notes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
