'use client';

import { useProfile } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Key,
    CreditCard,
    Wrench,
    Loader2,
    Plus,
    Copy,
    Check,
    Clock,
    AlertCircle,
    X,
    Send,
    Building,
    Calendar,
    TrendingUp,
    ChevronRight,
} from 'lucide-react';

export default function TenantDashboard() {
    const { profile, loading } = useProfile();
    const [unit, setUnit] = useState<any>(null);
    const [gatePasses, setGatePasses] = useState<any[]>([]);
    const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showNewPassModal, setShowNewPassModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: unitData } = await supabase
                .from('units')
                .select('*, properties(name, address)')
                .eq('current_tenant_id', user.id)
                .single();

            setUnit(unitData);

            if (unitData) {
                const { data: passes } = await supabase
                    .from('gate_passes')
                    .select('*')
                    .eq('tenant_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                setGatePasses(passes || []);

                const { data: maintenance } = await supabase
                    .from('maintenance_requests')
                    .select('*')
                    .eq('tenant_id', user.id)
                    .order('created_at', { ascending: false });

                setMaintenanceRequests(maintenance || []);
            }

            setLoadingData(false);
        };

        fetchData();
    }, []);

    const revokePass = async (passId: string) => {
        await supabase.from('gate_passes').update({ status: 'revoked' }).eq('id', passId);
        setGatePasses(gatePasses.map(p => p.id === passId ? { ...p, status: 'revoked' } : p));
    };

    if (loading || loadingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const today = new Date();
    const rentDueDay = unit?.rent_due_day || 1;
    const daysUntilDue = rentDueDay - today.getDate();
    const isRentDueSoon = daysUntilDue > 0 && daysUntilDue <= 5;
    const isRentOverdue = daysUntilDue < 0;

    const activePasses = gatePasses.filter(
        p => p.status === 'active' && new Date(p.valid_until) > new Date()
    ).length;

    const pendingMaintenance = maintenanceRequests.filter(
        m => ['pending', 'acknowledged', 'scheduled'].includes(m.status)
    ).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">Welcome back! Here's your tenancy overview.</p>
            </div>

            {/* Rent Alert */}
            {unit && (isRentDueSoon || isRentOverdue) && (
                <div className={`p-4 rounded-xl flex items-center gap-4 ${isRentOverdue ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                    }`}>
                    <AlertCircle className={isRentOverdue ? 'text-red-500' : 'text-amber-500'} size={24} />
                    <div className="flex-1">
                        <p className={`font-medium ${isRentOverdue ? 'text-red-700' : 'text-amber-700'}`}>
                            {isRentOverdue ? 'Rent Overdue!' : 'Rent Due Soon'}
                        </p>
                        <p className={`text-sm ${isRentOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                            {isRentOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `Due in ${daysUntilDue} days`}
                        </p>
                    </div>
                    <button className={`px-4 py-2 rounded-lg font-medium ${isRentOverdue ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}>
                        Pay Now
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Key className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Passes</p>
                            <p className="text-2xl font-bold text-slate-900">{activePasses}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Monthly Rent</p>
                            <p className="text-2xl font-bold text-slate-900">KES {(unit?.rent_amount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Wrench className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Open Issues</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingMaintenance}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Rent Due</p>
                            <p className="text-2xl font-bold text-slate-900">{rentDueDay}th</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Property Card + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Property Info */}
                {unit && (
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <Building size={32} />
                                <div>
                                    <p className="text-2xl font-bold">{unit.properties?.name}</p>
                                    <p className="text-indigo-100">{unit.properties?.address}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Unit</p>
                                <p className="text-xl font-bold text-slate-900">{unit.unit_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Status</p>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Active Lease
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Lease Start</p>
                                <p className="text-xl font-bold text-slate-900">{new Date(unit.lease_start || Date.now()).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowNewPassModal(true)}
                            className="w-full flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <Key className="text-white" size={20} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-slate-900">Create Visitor Pass</p>
                                <p className="text-sm text-slate-500">Generate a code for your guest</p>
                            </div>
                            <ChevronRight className="text-slate-400" size={20} />
                        </button>

                        <button
                            onClick={() => setShowMaintenanceModal(true)}
                            className="w-full flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                                <Wrench className="text-white" size={20} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-slate-900">Report Issue</p>
                                <p className="text-sm text-slate-500">Submit a maintenance request</p>
                            </div>
                            <ChevronRight className="text-slate-400" size={20} />
                        </button>

                        <button className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <CreditCard className="text-white" size={20} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-slate-900">Pay Rent</p>
                                <p className="text-sm text-slate-500">M-Pesa or Card payment</p>
                            </div>
                            <ChevronRight className="text-slate-400" size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visitor Passes */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Recent Visitor Passes</h3>
                        <button className="text-indigo-600 text-sm font-medium flex items-center gap-1">
                            View All <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {gatePasses.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Key className="mx-auto mb-3 text-slate-300" size={40} />
                                <p>No passes generated yet</p>
                            </div>
                        ) : (
                            gatePasses.slice(0, 4).map((pass) => (
                                <GatePassItem key={pass.id} pass={pass} onRevoke={() => revokePass(pass.id)} />
                            ))
                        )}
                    </div>
                </div>

                {/* Maintenance */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Maintenance Requests</h3>
                        <button className="text-indigo-600 text-sm font-medium flex items-center gap-1">
                            View All <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {maintenanceRequests.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Wrench className="mx-auto mb-3 text-slate-300" size={40} />
                                <p>No maintenance requests</p>
                            </div>
                        ) : (
                            maintenanceRequests.slice(0, 4).map((req) => (
                                <MaintenanceItem key={req.id} request={req} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showNewPassModal && (
                <NewPassModal
                    unitId={unit?.id}
                    onClose={() => setShowNewPassModal(false)}
                    onCreated={(pass) => {
                        setGatePasses([pass, ...gatePasses]);
                        setShowNewPassModal(false);
                    }}
                />
            )}
            {showMaintenanceModal && (
                <MaintenanceModal
                    unitId={unit?.id}
                    onClose={() => setShowMaintenanceModal(false)}
                    onCreated={(req) => {
                        setMaintenanceRequests([req, ...maintenanceRequests]);
                        setShowMaintenanceModal(false);
                    }}
                />
            )}
        </div>
    );
}

function GatePassItem({ pass, onRevoke }: { pass: any; onRevoke: () => void }) {
    const [copied, setCopied] = useState(false);
    const isExpired = new Date(pass.valid_until) < new Date();
    const isActive = pass.status === 'active' && !isExpired;

    const copyCode = async () => {
        await navigator.clipboard.writeText(pass.access_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 flex items-center gap-4 hover:bg-slate-50">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                <Key className={isActive ? 'text-green-600' : 'text-slate-400'} size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900">
                        {pass.access_code.slice(0, 3)}-{pass.access_code.slice(3)}
                    </span>
                    {isActive && (
                        <button onClick={copyCode} className="p-1 hover:bg-slate-200 rounded">
                            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-slate-400" />}
                        </button>
                    )}
                </div>
                <p className="text-sm text-slate-500">{pass.visitor_name || 'Guest'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' :
                    pass.status === 'used' ? 'bg-blue-100 text-blue-700' :
                        pass.status === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                {isActive ? 'Active' : pass.status === 'used' ? 'Used' : pass.status === 'revoked' ? 'Revoked' : 'Expired'}
            </span>
        </div>
    );
}

function MaintenanceItem({ request }: { request: any }) {
    const statusConfig = {
        pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
        acknowledged: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Acknowledged' },
        scheduled: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Scheduled' },
        in_progress: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'In Progress' },
        completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
        rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    };
    const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
        <div className="p-4 flex items-center gap-4 hover:bg-slate-50">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${request.priority === 'emergency' ? 'bg-red-100' : request.priority === 'high' ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                <Wrench className={request.priority === 'emergency' ? 'text-red-600' : request.priority === 'high' ? 'text-amber-600' : 'text-slate-600'} size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 capitalize">{request.category}</p>
                <p className="text-sm text-slate-500 truncate">{request.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>{status.label}</span>
        </div>
    );
}

function NewPassModal({ unitId, onClose, onCreated }: { unitId: string; onClose: () => void; onCreated: (pass: any) => void }) {
    const [visitorName, setVisitorName] = useState('');
    const [duration, setDuration] = useState('24');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !unitId) return;

        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + parseInt(duration));

        const { data, error } = await supabase
            .from('gate_passes')
            .insert({ unit_id: unitId, tenant_id: user.id, visitor_name: visitorName || null, access_code: Math.floor(100000 + Math.random() * 900000).toString(), valid_until: validUntil.toISOString() })
            .select().single();

        if (!error && data) onCreated(data);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Create Visitor Pass</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Visitor Name</label>
                        <input type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Optional" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Valid For</label>
                        <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl">
                            <option value="1">1 hour</option><option value="4">4 hours</option><option value="12">12 hours</option><option value="24">24 hours</option><option value="48">48 hours</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Key size={20} />Generate Pass</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

function MaintenanceModal({ unitId, onClose, onCreated }: { unitId: string; onClose: () => void; onCreated: (req: any) => void }) {
    const [category, setCategory] = useState('plumbing');
    const [priority, setPriority] = useState('medium');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !unitId) return;

        const { data, error } = await supabase.from('maintenance_requests').insert({ unit_id: unitId, tenant_id: user.id, category, priority, description }).select().single();
        if (!error && data) onCreated(data);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Report Issue</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl">
                            <option value="plumbing">Plumbing</option><option value="electrical">Electrical</option><option value="hvac">HVAC / AC</option><option value="appliance">Appliance</option><option value="structural">Structural</option><option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['low', 'medium', 'high', 'emergency'].map((p) => (
                                <button key={p} type="button" onClick={() => setPriority(p)} className={`py-2 rounded-lg text-sm font-medium capitalize ${priority === p ? (p === 'emergency' ? 'bg-red-600 text-white' : p === 'high' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white') : 'bg-slate-100 text-slate-600'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-xl resize-none" required />
                    </div>
                    <button type="submit" disabled={loading || !description.trim()} className="w-full py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} />Submit Request</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
