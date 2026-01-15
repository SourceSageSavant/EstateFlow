'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import {
    Wrench,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    MessageSquare,
} from 'lucide-react';

const categories = [
    { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'hvac', label: 'HVAC', icon: '❄️' },
    { value: 'appliance', label: 'Appliance', icon: '🔧' },
    { value: 'structural', label: 'Structural', icon: '🏠' },
    { value: 'other', label: 'Other', icon: '📋' },
];

const priorities = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-700' },
];

export default function TenantMaintenancePage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('maintenance_requests')
            .select('*')
            .eq('tenant_id', user.id)
            .order('created_at', { ascending: false });

        setRequests(data || []);
        setLoading(false);
    };

    const createRequest = async (data: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('unit_id')
            .eq('id', user.id)
            .single();

        if (!profile?.unit_id) {
            alert('You are not assigned to a unit');
            return;
        }

        await supabase.from('maintenance_requests').insert({
            tenant_id: user.id,
            unit_id: profile.unit_id,
            category: data.category,
            priority: data.priority,
            description: data.description,
            status: 'pending',
        });

        setShowCreateModal(false);
        fetchRequests();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'scheduled': return 'bg-purple-100 text-purple-700';
            case 'acknowledged': return 'bg-indigo-100 text-indigo-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
                    <p className="text-slate-600 mt-1">Report and track maintenance issues</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    New Request
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Pending</p>
                            <p className="text-xl font-bold text-slate-900">
                                {requests.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Wrench className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">In Progress</p>
                            <p className="text-xl font-bold text-slate-900">
                                {requests.filter(r => r.status === 'in_progress' || r.status === 'scheduled').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Completed</p>
                            <p className="text-xl font-bold text-slate-900">
                                {requests.filter(r => r.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="text-slate-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="text-xl font-bold text-slate-900">{requests.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {requests.length === 0 ? (
                    <div className="p-12 text-center">
                        <Wrench className="mx-auto mb-3 text-slate-300" size={40} />
                        <p className="text-slate-500">No maintenance requests yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {requests.map((request) => {
                            const category = categories.find(c => c.value === request.category);
                            const priority = priorities.find(p => p.value === request.priority);
                            return (
                                <div
                                    key={request.id}
                                    className="p-4 hover:bg-slate-50 cursor-pointer"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">{category?.icon || '📋'}</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-slate-900 capitalize">{request.category}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${priority?.color}`}>
                                                        {priority?.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{request.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                                                    <Calendar size={12} />
                                                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusBadge(request.status)}`}>
                                            {request.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {request.landlord_notes && (
                                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MessageSquare size={14} />
                                                <span className="font-medium">Landlord:</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{request.landlord_notes}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Request Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="New Maintenance Request"
            >
                <CreateRequestForm onSubmit={createRequest} />
            </Modal>
        </div>
    );
}

function CreateRequestForm({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [category, setCategory] = useState('other');
    const [priority, setPriority] = useState('medium');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ category, priority, description });
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                >
                    {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                >
                    {priorities.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 resize-none"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit Request'}
            </button>
        </form>
    );
}
