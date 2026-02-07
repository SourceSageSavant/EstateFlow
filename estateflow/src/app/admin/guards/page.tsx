'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import InviteModal from '@/components/InviteModal';
import {
    Shield,
    Plus,
    Search,
    MoreVertical,
    Mail,
    Phone,
    Building,
    X,
    Loader2,
    UserPlus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Send,
} from 'lucide-react';

export default function GuardsPage() {
    const [guards, setGuards] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedGuard, setSelectedGuard] = useState<any>(null);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: guardData } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'guard')
            .order('created_at', { ascending: false });

        setGuards(guardData || []);

        const { data: propertyData } = await supabase
            .from('properties')
            .select('*')
            .eq('owner_id', user.id);

        setProperties(propertyData || []);

        const { data: assignmentData } = await supabase
            .from('property_guards')
            .select('*, profiles(full_name), properties(name)')
            .eq('is_active', true);

        setAssignments(assignmentData || []);

        setLoading(false);
    };

    const filteredGuards = guards.filter(guard =>
        guard.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guard.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getGuardAssignments = (guardId: string) => {
        return assignments.filter(a => a.guard_id === guardId);
    };

    const handleEdit = (guard: any) => {
        setSelectedGuard(guard);
        setShowEditModal(true);
        setShowMenu(null);
    };

    const handleDelete = (guard: any) => {
        setSelectedGuard(guard);
        setShowDeleteModal(true);
        setShowMenu(null);
    };

    const confirmDelete = async () => {
        if (selectedGuard) {
            await supabase.from('profiles').delete().eq('id', selectedGuard.id);
            setShowDeleteModal(false);
            setSelectedGuard(null);
            fetchData();
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Guards</h1>
                    <p className="text-slate-600 mt-1">Manage security personnel for your properties</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Send size={20} />
                    <span>Invite Guard</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Shield className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Guards</p>
                            <p className="text-2xl font-bold text-slate-900">{guards.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Assigned</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {guards.filter(g => getGuardAssignments(g.id).length > 0).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Building className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Active Assignments</p>
                            <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search guards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                />
            </div>

            {/* Guards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGuards.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <Shield className="mx-auto mb-3 text-slate-300" size={40} />
                        <p className="text-slate-500">No guards found</p>
                    </div>
                ) : (
                    filteredGuards.map((guard) => {
                        const guardAssignments = getGuardAssignments(guard.id);
                        return (
                            <div key={guard.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <Shield className="text-indigo-600" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{guard.full_name || 'Unnamed'}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${guardAssignments.length > 0
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {guardAssignments.length > 0 ? 'Active' : 'Unassigned'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMenu(showMenu === guard.id ? null : guard.id)}
                                            className="p-1 text-slate-400 hover:text-slate-600"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {showMenu === guard.id && (
                                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                                                <button
                                                    onClick={() => handleEdit(guard)}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Edit size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(guard)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Mail size={14} />
                                        <span className="truncate">{guard.email}</span>
                                    </div>
                                    {guard.phone && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Phone size={14} />
                                            <span>{guard.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {guardAssignments.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 mb-2">Assigned Properties:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {guardAssignments.map((a) => (
                                                <span key={a.id} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                                                    {a.properties?.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setSelectedGuard(guard);
                                        setShowAssignModal(true);
                                    }}
                                    className="w-full mt-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    {guardAssignments.length > 0 ? 'Manage Assignments' : 'Assign to Property'}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>


            {/* Add Guard Modal */}
            {showAddModal && (
                <GuardModal
                    title="Add New Guard"
                    onClose={() => setShowAddModal(false)}
                    onSubmit={async (data) => {
                        const guardData: Record<string, unknown> = {
                            id: crypto.randomUUID(),
                            full_name: data.full_name,
                            phone_number: data.phone,
                            role: 'guard',
                        };
                        // @ts-ignore
                        await supabase.from('profiles').insert(guardData);
                        setShowAddModal(false);
                        fetchData();
                    }}
                />
            )}

            {/* Edit Guard Modal */}
            {showEditModal && selectedGuard && (
                <GuardModal
                    title="Edit Guard"
                    guard={selectedGuard}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedGuard(null);
                    }}
                    onSubmit={async (data) => {
                        const updateData: Record<string, unknown> = {
                            full_name: data.full_name,
                            phone_number: data.phone,
                        };
                        // @ts-ignore
                        await supabase.from('profiles').update(updateData).eq('id', selectedGuard.id);
                        setShowEditModal(false);
                        setSelectedGuard(null);
                        fetchData();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedGuard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Guard?</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Are you sure you want to delete <strong>{selectedGuard.full_name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Property Modal */}
            {showAssignModal && selectedGuard && (
                <AssignPropertyModal
                    guard={selectedGuard}
                    properties={properties}
                    currentAssignments={getGuardAssignments(selectedGuard.id)}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedGuard(null);
                    }}
                    onUpdated={() => {
                        setShowAssignModal(false);
                        setSelectedGuard(null);
                        fetchData();
                    }}
                />
            )}

            {/* Invite Guard Modal */}
            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onInviteSent={() => {
                    setShowInviteModal(false);
                    fetchData();
                }}
                role="guard"
                properties={properties}
            />
        </div>
    );
}

function GuardModal({ title, guard, onClose, onSubmit }: { title: string; guard?: any; onClose: () => void; onSubmit: (data: { email: string; full_name: string; phone: string }) => Promise<void> }) {
    const [email, setEmail] = useState(guard?.email || '');
    const [fullName, setFullName] = useState(guard?.full_name || '');
    const [phone, setPhone] = useState(guard?.phone || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ email, full_name: fullName, phone });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                            required
                            disabled={!!guard}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+254..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : guard ? 'Save Changes' : <><UserPlus size={20} />Add Guard</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

function AssignPropertyModal({ guard, properties, currentAssignments, onClose, onUpdated }: { guard: any; properties: any[]; currentAssignments: any[]; onClose: () => void; onUpdated: () => void }) {
    const [selectedProperty, setSelectedProperty] = useState('');
    const [shift, setShift] = useState('day');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const assignedPropertyIds = currentAssignments.map(a => a.property_id);
    const availableProperties = properties.filter(p => !assignedPropertyIds.includes(p.id));

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProperty) return;
        setLoading(true);

        const assignmentData: Record<string, unknown> = {
            guard_id: guard.id,
            property_id: selectedProperty,
            shift_type: shift,
            is_active: true,
        };
        // @ts-ignore
        await supabase.from('property_guards').insert(assignmentData);

        onUpdated();
        setLoading(false);
    };

    const handleRemove = async (assignmentId: string) => {
        // @ts-ignore
        await supabase.from('property_guards').update({ is_active: false }).eq('id', assignmentId);
        onUpdated();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Manage Assignments</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-slate-600 mb-4">
                    Guard: <strong>{guard.full_name}</strong>
                </p>

                {/* Current Assignments */}
                {currentAssignments.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm font-medium text-slate-700 mb-2">Current Assignments:</p>
                        <div className="space-y-2">
                            {currentAssignments.map((a) => (
                                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-900">{a.properties?.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{a.shift_type} shift</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(a.id)}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add New Assignment */}
                {availableProperties.length > 0 && (
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Add to Property</label>
                            <select
                                value={selectedProperty}
                                onChange={(e) => setSelectedProperty(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                            >
                                <option value="">Select property...</option>
                                {availableProperties.map((prop) => (
                                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Shift</label>
                            <select
                                value={shift}
                                onChange={(e) => setShift(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                            >
                                <option value="day">Day Shift</option>
                                <option value="night">Night Shift</option>
                                <option value="rotating">Rotating</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !selectedProperty}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Assign to Property'}
                        </button>
                    </form>
                )}

                {availableProperties.length === 0 && currentAssignments.length > 0 && (
                    <p className="text-sm text-slate-500 text-center">
                        Guard is assigned to all your properties.
                    </p>
                )}
            </div>
        </div>
    );
}
