'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import {
    Home,
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Loader2,
    Users,
    DollarSign,
    MoreVertical,
    UserMinus,
} from 'lucide-react';

export default function UnitsPage() {
    const params = useParams();
    const [property, setProperty] = useState<any>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        const { data: propertyData } = await supabase
            .from('properties')
            .select('*')
            .eq('id', params.id)
            .single();

        setProperty(propertyData);

        const { data: unitsData } = await supabase
            .from('units')
            .select('*, current_tenant:profiles(id, full_name, phone_number)')
            .eq('property_id', params.id)
            .order('unit_number');

        setUnits(unitsData || []);

        const { data: tenantData } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'tenant')
            .is('unit_id', null);

        setTenants(tenantData || []);
        setLoading(false);
    };

    const handleEdit = (unit: any) => {
        setSelectedUnit(unit);
        setShowEditModal(true);
        setShowMenu(null);
    };

    const handleDelete = (unit: any) => {
        setSelectedUnit(unit);
        setShowDeleteModal(true);
        setShowMenu(null);
    };

    const handleAssign = (unit: any) => {
        setSelectedUnit(unit);
        setShowAssignModal(true);
        setShowMenu(null);
    };

    const confirmDelete = async () => {
        if (selectedUnit) {
            await supabase.from('units').delete().eq('id', selectedUnit.id);
            setShowDeleteModal(false);
            setSelectedUnit(null);
            fetchData();
        }
    };

    const handleUnassign = async (unit: any) => {
        await supabase.from('units').update({ current_tenant_id: null, status: 'vacant' }).eq('id', unit.id);
        fetchData();
        setShowMenu(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const occupiedCount = units.filter(u => u.current_tenant_id).length;
    const vacantCount = units.filter(u => !u.current_tenant_id).length;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href={`/admin/properties/${params.id}`}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft size={20} />
                Back to {property?.name || 'Property'}
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Units</h1>
                    <p className="text-slate-600 mt-1">{property?.name} • {property?.address}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    Add Unit
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Home className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Units</p>
                            <p className="text-xl font-bold text-slate-900">{units.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Occupied</p>
                            <p className="text-xl font-bold text-slate-900">{occupiedCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Home className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Vacant</p>
                            <p className="text-xl font-bold text-slate-900">{vacantCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {units.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <Home className="mx-auto mb-3 text-slate-300" size={40} />
                        <p className="text-slate-500 mb-4">No units added yet</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Plus size={20} />
                            Add First Unit
                        </button>
                    </div>
                ) : (
                    units.map((unit) => (
                        <div key={unit.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unit.current_tenant_id ? 'bg-green-100' : 'bg-slate-100'
                                        }`}>
                                        <Home className={unit.current_tenant_id ? 'text-green-600' : 'text-slate-400'} size={24} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Unit {unit.unit_number}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${unit.current_tenant_id
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {unit.current_tenant_id ? 'Occupied' : 'Vacant'}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMenu(showMenu === unit.id ? null : unit.id)}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {showMenu === unit.id && (
                                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                                            <button
                                                onClick={() => handleEdit(unit)}
                                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                            >
                                                <Edit size={16} />
                                                Edit
                                            </button>
                                            {!unit.current_tenant_id && (
                                                <button
                                                    onClick={() => handleAssign(unit)}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Users size={16} />
                                                    Assign Tenant
                                                </button>
                                            )}
                                            {unit.current_tenant_id && (
                                                <button
                                                    onClick={() => handleUnassign(unit)}
                                                    className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                                >
                                                    <UserMinus size={16} />
                                                    Remove Tenant
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(unit)}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <DollarSign size={14} />
                                    <span>KES {unit.rent_amount?.toLocaleString()}/mo</span>
                                </div>
                                {unit.rent_due_day && (
                                    <p className="text-slate-500 text-xs">Due: Day {unit.rent_due_day} of each month</p>
                                )}
                            </div>

                            {unit.current_tenant && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Current Tenant:</p>
                                    <p className="font-medium text-slate-900">{unit.current_tenant.full_name}</p>
                                    {unit.current_tenant.phone_number && (
                                        <p className="text-xs text-slate-500">{unit.current_tenant.phone_number}</p>
                                    )}
                                </div>
                            )}

                            {!unit.current_tenant_id && (
                                <button
                                    onClick={() => handleAssign(unit)}
                                    className="w-full mt-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                                >
                                    Assign Tenant
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Unit Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Unit"
            >
                <UnitForm
                    propertyId={params.id as string}
                    onSaved={() => {
                        setShowAddModal(false);
                        fetchData();
                    }}
                />
            </Modal>

            {/* Edit Unit Modal */}
            <Modal
                isOpen={showEditModal && !!selectedUnit}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedUnit(null);
                }}
                title="Edit Unit"
            >
                {selectedUnit && (
                    <UnitForm
                        propertyId={params.id as string}
                        unit={selectedUnit}
                        onSaved={() => {
                            setShowEditModal(false);
                            setSelectedUnit(null);
                            fetchData();
                        }}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal && !!selectedUnit}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Unit?"
                maxWidth="max-w-sm"
            >
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="text-red-600" size={24} />
                    </div>
                    <p className="text-slate-500 text-sm mb-6">
                        Are you sure you want to delete <strong>Unit {selectedUnit?.unit_number}</strong>?
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
            </Modal>

            {/* Assign Tenant Modal */}
            <Modal
                isOpen={showAssignModal && !!selectedUnit}
                onClose={() => {
                    setShowAssignModal(false);
                    setSelectedUnit(null);
                }}
                title="Assign Tenant"
            >
                {selectedUnit && (
                    <AssignTenantForm
                        unit={selectedUnit}
                        tenants={tenants}
                        onAssigned={() => {
                            setShowAssignModal(false);
                            setSelectedUnit(null);
                            fetchData();
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}

function UnitForm({ propertyId, unit, onSaved }: { propertyId: string; unit?: any; onSaved: () => void }) {
    const [unitNumber, setUnitNumber] = useState(unit?.unit_number || '');
    const [rentAmount, setRentAmount] = useState(unit?.rent_amount?.toString() || '');
    const [rentDueDay, setRentDueDay] = useState(unit?.rent_due_day?.toString() || '1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            property_id: propertyId,
            unit_number: unitNumber,
            rent_amount: parseFloat(rentAmount),
            rent_due_day: parseInt(rentDueDay),
        };

        if (unit) {
            const { error: updateError } = await supabase.from('units').update(data).eq('id', unit.id);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase.from('units').insert(data);
            if (insertError) {
                if (insertError.code === '23505' || insertError.message.includes('unique')) {
                    setError('A unit with this number already exists in this property.');
                    setLoading(false);
                    return;
                }
                throw insertError;
            }
        }

        onSaved();
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unit Number</label>
                <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="e.g., A1, 101, Ground Floor"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Rent (KES)</label>
                <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    placeholder="e.g., 25000"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rent Due Day</label>
                <select
                    value={rentDueDay}
                    onChange={(e) => setRentDueDay(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>Day {day}</option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : unit ? 'Save Changes' : 'Add Unit'}
            </button>
        </form>
    );
}

function AssignTenantForm({ unit, tenants, onAssigned }: { unit: any; tenants: any[]; onAssigned: () => void }) {
    const [selectedTenant, setSelectedTenant] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;
        setLoading(true);

        await supabase.from('units').update({
            current_tenant_id: selectedTenant,
            status: 'occupied',
        }).eq('id', unit.id);

        onAssigned();
        setLoading(false);
    };

    return (
        <>
            <p className="text-slate-600 mb-4">
                Assign a tenant to <strong>Unit {unit.unit_number}</strong>
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Tenant</label>
                    {tenants.length === 0 ? (
                        <p className="text-amber-600 text-sm">No unassigned tenants available.</p>
                    ) : (
                        <select
                            value={selectedTenant}
                            onChange={(e) => setSelectedTenant(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                            required
                        >
                            <option value="">Choose a tenant...</option>
                            {tenants.map((tenant) => (
                                <option key={tenant.id} value={tenant.id}>
                                    {tenant.full_name} ({tenant.email})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={loading || tenants.length === 0 || !selectedTenant}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Assign Tenant'}
                </button>
            </form>
        </>
    );
}
