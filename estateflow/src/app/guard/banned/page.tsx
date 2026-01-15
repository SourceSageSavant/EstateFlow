'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import {
    Ban,
    Plus,
    Clock,
    User,
    Loader2,
    Trash2,
    AlertTriangle,
} from 'lucide-react';

export default function BannedVisitorsPage() {
    const [bannedVisitors, setBannedVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchBanned();
    }, []);

    const fetchBanned = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get guard's assigned properties
        const { data: assignments } = await supabase
            .from('property_guards')
            .select('property_id')
            .eq('guard_id', user.id)
            .eq('is_active', true);

        if (assignments && assignments.length > 0) {
            const propertyIds = assignments.map(a => a.property_id);
            const { data } = await supabase
                .from('banned_visitors')
                .select('*, properties(name)')
                .in('property_id', propertyIds)
                .order('banned_at', { ascending: false });

            setBannedVisitors(data || []);
        }
        setLoading(false);
    };

    const addBanned = async (data: { visitor_name: string; description: string; property_id: string }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('banned_visitors').insert({
            ...data,
            banned_by: user.id,
        });

        setShowAddModal(false);
        fetchBanned();
    };

    const removeBan = async (id: string) => {
        if (!confirm('Are you sure you want to remove this ban?')) return;
        await supabase.from('banned_visitors').delete().eq('id', id);
        fetchBanned();
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
                    <h1 className="text-2xl font-bold text-slate-900">Banned Visitors</h1>
                    <p className="text-slate-600 mt-1">Visitors prohibited from entering the property</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <Plus size={20} />
                    Add to Ban List
                </button>
            </div>

            {/* Warning Banner */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                <div>
                    <p className="font-medium text-red-800">Strict Entry Denial</p>
                    <p className="text-sm text-red-600">
                        Visitors on this list must be denied entry and reported to management
                    </p>
                </div>
            </div>

            {/* Banned List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {bannedVisitors.length === 0 ? (
                    <div className="p-12 text-center">
                        <Ban className="mx-auto mb-3 text-slate-300" size={40} />
                        <p className="text-slate-500">No banned visitors</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {bannedVisitors.map((visitor) => (
                            <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-red-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <Ban className="text-red-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{visitor.visitor_name}</p>
                                        <p className="text-sm text-slate-500">{visitor.description || 'No description'}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                            <Clock size={12} />
                                            <span>Banned {new Date(visitor.banned_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{visitor.properties?.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeBan(visitor.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Remove ban"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Ban Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add to Ban List"
            >
                <AddBanForm onSubmit={addBanned} />
            </Modal>
        </div>
    );
}

function AddBanForm({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [visitorName, setVisitorName] = useState('');
    const [description, setDescription] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('property_guards')
            .select('property_id, properties(id, name)')
            .eq('guard_id', user.id)
            .eq('is_active', true);

        if (data) {
            const props = data.map(d => d.properties).filter(Boolean);
            setProperties(props);
            if (props.length > 0) setPropertyId(props[0].id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ visitor_name: visitorName, description, property_id: propertyId });
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visitor Name</label>
                <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Enter visitor's name"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
                <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-slate-900"
                    required
                >
                    {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason (Optional)</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why is this visitor banned?"
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400 resize-none"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Add to Ban List'}
            </button>
        </form>
    );
}
