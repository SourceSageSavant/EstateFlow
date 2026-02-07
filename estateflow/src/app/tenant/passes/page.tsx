'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import {
    Key,
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    QrCode,
    Copy,
    Trash2,
    Calendar,
    User,
    Share2,
} from 'lucide-react';

export default function PassesPage() {
    const [passes, setPasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedPass, setSelectedPass] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchPasses();
    }, []);

    const fetchPasses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('gate_passes')
            .select('*')
            .eq('tenant_id', user.id)
            .order('created_at', { ascending: false });

        setPasses(data || []);
        setLoading(false);
    };

    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const createPass = async (data: { visitor_name: string; valid_until: string; pass_type: string }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's unit
        const { data: profile } = await supabase
            .from('profiles')
            .select('unit_id')
            .eq('id', user.id)
            .single();

        if (!profile?.unit_id) {
            alert('You are not assigned to a unit');
            return;
        }

        const code = generateCode();
        await supabase.from('gate_passes').insert({
            tenant_id: user.id,
            unit_id: profile.unit_id,
            visitor_name: data.visitor_name,
            access_code: code,
            pass_type: data.pass_type,
            valid_until: data.valid_until,
            status: 'active',
        });

        setShowCreateModal(false);
        fetchPasses();
    };

    const revokePass = async (passId: string) => {
        await supabase.from('gate_passes').update({ status: 'revoked' }).eq('id', passId);
        fetchPasses();
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Code copied!');
    };

    const getStatusColor = (status: string, validUntil: string) => {
        if (status === 'cancelled') return 'bg-red-100 text-red-700';
        if (status === 'checked_out') return 'bg-slate-100 text-slate-600';
        if (status === 'checked_in') return 'bg-blue-100 text-blue-700';
        if (new Date(validUntil) < new Date()) return 'bg-amber-100 text-amber-700';
        return 'bg-green-100 text-green-700';
    };

    const getStatusLabel = (status: string, validUntil: string) => {
        if (status === 'cancelled') return 'Cancelled';
        if (status === 'checked_out') return 'Checked Out';
        if (status === 'checked_in') return 'Checked In';
        if (new Date(validUntil) < new Date()) return 'Expired';
        return 'Active';
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
                    <h1 className="text-2xl font-bold text-slate-900">Visitor Passes</h1>
                    <p className="text-slate-600 mt-1">Create and manage access codes for your visitors</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    Create Pass
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Passes</p>
                            <p className="text-xl font-bold text-slate-900">
                                {passes.filter(p => p.status === 'pending' && new Date(p.valid_until) > new Date()).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Used Passes</p>
                            <p className="text-xl font-bold text-slate-900">
                                {passes.filter(p => p.status === 'checked_in' || p.status === 'checked_out').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <XCircle className="text-slate-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Expired/Revoked</p>
                            <p className="text-xl font-bold text-slate-900">
                                {passes.filter(p => p.status === 'cancelled' || p.status === 'expired' || new Date(p.valid_until) < new Date()).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Passes List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {passes.length === 0 ? (
                    <div className="p-12 text-center">
                        <Key className="mx-auto mb-3 text-slate-300" size={40} />
                        <p className="text-slate-500">No passes created yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 text-indigo-600 hover:underline"
                        >
                            Create your first pass
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {passes.map((pass) => (
                            <div key={pass.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <Key className="text-indigo-600" size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-slate-900">{pass.visitor_name || 'Visitor'}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(pass.status, pass.valid_until)}`}>
                                                {getStatusLabel(pass.status, pass.valid_until)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                                                {pass.access_code}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(pass.valid_until).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyCode(pass.access_code)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        title="Copy code"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedPass(pass);
                                            setShowQRModal(true);
                                        }}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        title="Show QR"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                    {pass.status === 'pending' && new Date(pass.valid_until) > new Date() && (
                                        <button
                                            onClick={() => revokePass(pass.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Cancel"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Pass Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Visitor Pass"
            >
                <CreatePassForm onSubmit={createPass} />
            </Modal>

            {/* QR Code Modal */}
            <Modal
                isOpen={showQRModal && !!selectedPass}
                onClose={() => setShowQRModal(false)}
                title="Access Code"
                maxWidth="max-w-sm"
            >
                {selectedPass && (
                    <div className="text-center">
                        {selectedPass.qr_data ? (
                            <img
                                src={selectedPass.qr_data}
                                alt="QR Code"
                                className="w-48 h-48 mx-auto mb-4 rounded-xl"
                            />
                        ) : (
                            <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <div className="text-center">
                                    <QrCode className="text-slate-300 mx-auto mb-2" size={64} />
                                    <p className="text-3xl font-mono font-bold text-slate-900">{selectedPass.access_code}</p>
                                </div>
                            </div>
                        )}
                        <p className="text-2xl font-mono font-bold text-indigo-600 mb-2">{selectedPass.access_code}</p>
                        <p className="text-slate-600">Share this code with <strong>{selectedPass.visitor_name}</strong></p>
                        <p className="text-sm text-slate-500 mt-1">
                            Valid until {new Date(selectedPass.valid_until).toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => copyCode(selectedPass.access_code)}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                                <Copy size={18} />
                                Copy Code
                            </button>
                            {navigator.share && (
                                <button
                                    onClick={() => {
                                        navigator.share({
                                            title: 'Gate Pass',
                                            text: `Your access code is: ${selectedPass.access_code}. Valid until ${new Date(selectedPass.valid_until).toLocaleString()}`,
                                        });
                                    }}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                                >
                                    <Share2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function CreatePassForm({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [visitorName, setVisitorName] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [passType, setPassType] = useState('single');
    const [loading, setLoading] = useState(false);

    // Set default valid_until to tomorrow
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setValidUntil(tomorrow.toISOString().slice(0, 16));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ visitor_name: visitorName, valid_until: validUntil, pass_type: passType });
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
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Valid Until</label>
                <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pass Type</label>
                <select
                    value={passType}
                    onChange={(e) => setPassType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                >
                    <option value="single">Single Use</option>
                    <option value="recurring">Recurring (Multiple Uses)</option>
                </select>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create Pass'}
            </button>
        </form>
    );
}
