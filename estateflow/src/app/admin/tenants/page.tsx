'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Mail,
    Phone,
    Home,
    X,
    Loader2,
    UserPlus,
    Edit,
    Trash2,
} from 'lucide-react';

export default function TenantsPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tenantData } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'tenant')
            .order('created_at', { ascending: false });

        setTenants(tenantData || []);

        const { data: propertyData } = await supabase
            .from('properties')
            .select('id')
            .eq('owner_id', user.id);

        if (propertyData && propertyData.length > 0) {
            const propertyIds = propertyData.map((p: any) => p.id);
            const { data: unitData } = await supabase
                .from('units')
                .select('*, properties(name)')
                .in('property_id', propertyIds)
                .is('current_tenant_id', null);

            setUnits(unitData || []);
        }

        setLoading(false);
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.phone?.includes(searchQuery)
    );

    const handleEdit = (tenant: any) => {
        setSelectedTenant(tenant);
        setShowEditModal(true);
        setShowMenu(null);
    };

    const handleDelete = (tenant: any) => {
        setSelectedTenant(tenant);
        setShowDeleteModal(true);
        setShowMenu(null);
    };

    const confirmDelete = async () => {
        if (selectedTenant) {
            await supabase.from('profiles').delete().eq('id', selectedTenant.id);
            setShowDeleteModal(false);
            setSelectedTenant(null);
            fetchData();
        }
    };

    const handleAssign = (tenant: any) => {
        setSelectedTenant(tenant);
        setShowAssignModal(true);
        setShowMenu(null);
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tenants</h1>
                    <p className="text-slate-600 mt-1">Manage your property tenants</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add Tenant</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Users className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Tenants</p>
                            <p className="text-2xl font-bold text-slate-900">{tenants.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Home className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Assigned</p>
                            <p className="text-2xl font-bold text-slate-900">{tenants.filter(t => t.unit_id).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <UserPlus className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Unassigned</p>
                            <p className="text-2xl font-bold text-slate-900">{tenants.filter(t => !t.unit_id).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search tenants by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                />
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Tenant</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500 hidden sm:table-cell">Contact</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500 hidden md:table-cell">Unit</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <Users className="mx-auto mb-3 text-slate-300" size={40} />
                                        <p>No tenants found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 font-medium">
                                                        {tenant.full_name?.charAt(0) || 'T'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{tenant.full_name || 'Unnamed'}</p>
                                                    <p className="text-sm text-slate-500 sm:hidden">{tenant.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Mail size={14} />
                                                    <span>{tenant.email}</span>
                                                </div>
                                                {tenant.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Phone size={14} />
                                                        <span>{tenant.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-slate-600">
                                                {tenant.unit_id ? 'Assigned' : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tenant.unit_id
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {tenant.unit_id ? 'Active' : 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 relative">
                                                {!tenant.unit_id && (
                                                    <button
                                                        onClick={() => handleAssign(tenant)}
                                                        className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                                                    >
                                                        Assign
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowMenu(showMenu === tenant.id ? null : tenant.id)}
                                                    className="p-1 text-slate-400 hover:text-slate-600"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {showMenu === tenant.id && (
                                                    <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                                                        <button
                                                            onClick={() => handleEdit(tenant)}
                                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Edit size={16} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tenant)}
                                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={16} />
                                                            Delete
                                                        </button>
                                                    </div>
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

            {/* Add Tenant Modal */}
            {showAddModal && (
                <TenantModal
                    title="Add New Tenant"
                    onClose={() => setShowAddModal(false)}
                    onSubmit={async (data) => {
                        await supabase.from('profiles').insert({
                            id: crypto.randomUUID(),
                            ...data,
                            role: 'tenant',
                        });
                        setShowAddModal(false);
                        fetchData();
                    }}
                />
            )}

            {/* Edit Tenant Modal */}
            {showEditModal && selectedTenant && (
                <TenantModal
                    title="Edit Tenant"
                    tenant={selectedTenant}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedTenant(null);
                    }}
                    onSubmit={async (data) => {
                        await supabase.from('profiles').update(data).eq('id', selectedTenant.id);
                        setShowEditModal(false);
                        setSelectedTenant(null);
                        fetchData();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Tenant?</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Are you sure you want to delete <strong>{selectedTenant.full_name}</strong>? This action cannot be undone.
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

            {/* Assign Unit Modal */}
            {showAssignModal && selectedTenant && (
                <AssignUnitModal
                    tenant={selectedTenant}
                    units={units}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedTenant(null);
                    }}
                    onAssigned={() => {
                        setShowAssignModal(false);
                        setSelectedTenant(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}

function TenantModal({ title, tenant, onClose, onSubmit }: { title: string; tenant?: any; onClose: () => void; onSubmit: (data: { email: string; full_name: string; phone: string }) => Promise<void> }) {
    const [email, setEmail] = useState(tenant?.email || '');
    const [fullName, setFullName] = useState(tenant?.full_name || '');
    const [phone, setPhone] = useState(tenant?.phone || '');
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
                            disabled={!!tenant}
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
                        {loading ? <Loader2 className="animate-spin" size={20} /> : tenant ? 'Save Changes' : <><UserPlus size={20} />Add Tenant</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

function AssignUnitModal({ tenant, units, onClose, onAssigned }: { tenant: any; units: any[]; onClose: () => void; onAssigned: () => void }) {
    const [selectedUnit, setSelectedUnit] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnit) return;
        setLoading(true);

        await supabase
            .from('units')
            .update({ current_tenant_id: tenant.id, is_occupied: true })
            .eq('id', selectedUnit);

        onAssigned();
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Assign Unit</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-slate-600 mb-4">
                    Assign <strong>{tenant.full_name}</strong> to a unit:
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Unit</label>
                        {units.length === 0 ? (
                            <p className="text-amber-600 text-sm">No available units. Add units to your properties first.</p>
                        ) : (
                            <select
                                value={selectedUnit}
                                onChange={(e) => setSelectedUnit(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                                required
                            >
                                <option value="">Choose a unit...</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.properties?.name} - Unit {unit.unit_number} (KES {unit.rent_amount?.toLocaleString()}/mo)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading || units.length === 0 || !selectedUnit}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Assign Unit'}
                    </button>
                </form>
            </div>
        </div>
    );
}
