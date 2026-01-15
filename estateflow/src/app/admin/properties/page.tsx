'use client';

import { useState } from 'react';
import { Plus, Building2, MapPin, Home, MoreVertical, Loader2, Edit, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useProperties } from '@/lib/hooks';
import Modal from '@/components/ui/Modal';

export default function PropertiesPage() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const { properties, loading, error, createProperty, updateProperty, deleteProperty } = useProperties();

    const handleEdit = (property: any) => {
        setSelectedProperty(property);
        setShowEditModal(true);
        setShowMenu(null);
    };

    const handleDelete = (property: any) => {
        setSelectedProperty(property);
        setShowDeleteModal(true);
        setShowMenu(null);
    };

    const confirmDelete = async () => {
        if (selectedProperty) {
            await deleteProperty(selectedProperty.id);
            setShowDeleteModal(false);
            setSelectedProperty(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                Error loading properties: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Properties</h1>
                    <p className="text-slate-600 mt-1">Manage your rental properties</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                    <Plus size={20} />
                    Add Property
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Building2 className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Properties</p>
                            <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <Home className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Units</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {properties.reduce((sum, p) => sum + (p.total_units || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Users className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Occupancy Rate</p>
                            <p className="text-2xl font-bold text-slate-900">--%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties Grid */}
            {properties.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">No properties yet</h3>
                    <p className="text-slate-500 mt-1 mb-4">
                        Get started by adding your first property.
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <Plus size={20} />
                        Add Property
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => {
                        const occupiedUnits = property.units?.filter((u: any) => u.status === 'occupied').length || 0;
                        const totalUnits = property.total_units || 0;
                        const occupancyPercent = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

                        return (
                            <div
                                key={property.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-100 p-2 rounded-lg">
                                                <Building2 className="text-indigo-600" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{property.name}</h3>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {property.address}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowMenu(showMenu === property.id ? null : property.id)}
                                                className="p-1 hover:bg-slate-100 rounded"
                                            >
                                                <MoreVertical size={20} className="text-slate-400" />
                                            </button>
                                            {showMenu === property.id && (
                                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                                                    <button
                                                        onClick={() => handleEdit(property)}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Edit size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(property)}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Home size={16} className="text-slate-400" />
                                            <span className="text-slate-600">
                                                {occupiedUnits}/{totalUnits} occupied
                                            </span>
                                        </div>
                                    </div>

                                    {/* Occupancy Bar */}
                                    <div className="mt-3">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${occupancyPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between">
                                    <Link
                                        href={`/admin/properties/${property.id}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        View Details
                                    </Link>
                                    <Link
                                        href={`/admin/properties/${property.id}/units`}
                                        className="text-sm text-slate-600 hover:text-slate-700"
                                    >
                                        Manage Units
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Property Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Property"
            >
                <PropertyForm
                    onSubmit={async (data) => {
                        await createProperty(data);
                        setShowAddModal(false);
                    }}
                />
            </Modal>

            {/* Edit Property Modal */}
            <Modal
                isOpen={showEditModal && !!selectedProperty}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedProperty(null);
                }}
                title="Edit Property"
            >
                {selectedProperty && (
                    <PropertyForm
                        property={selectedProperty}
                        onSubmit={async (data) => {
                            await updateProperty(selectedProperty.id, data);
                            setShowEditModal(false);
                            setSelectedProperty(null);
                        }}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal && !!selectedProperty}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Property?"
                maxWidth="max-w-sm"
            >
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="text-red-600" size={24} />
                    </div>
                    <p className="text-slate-500 text-sm mb-6">
                        Are you sure you want to delete <strong>{selectedProperty?.name}</strong>? This action cannot be undone.
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
        </div>
    );
}

function PropertyForm({
    property,
    onSubmit,
}: {
    property?: any;
    onSubmit: (data: { name: string; address: string; total_units: number }) => Promise<void>;
}) {
    const [name, setName] = useState(property?.name || '');
    const [address, setAddress] = useState(property?.address || '');
    const [totalUnits, setTotalUnits] = useState(property?.total_units?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSubmit({
                name,
                address,
                total_units: parseInt(totalUnits, 10),
            });
        } catch (err: any) {
            setError(err.message || 'Failed to save property');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Property Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sunset Apartments"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    required
                />
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                </label>
                <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street, City"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    required
                />
            </div>

            <div>
                <label htmlFor="units" className="block text-sm font-medium text-slate-700 mb-1">
                    Total Units
                </label>
                <input
                    id="units"
                    type="number"
                    min="1"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(e.target.value)}
                    placeholder="e.g., 12"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                    required
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : property ? 'Save Changes' : 'Create Property'}
                </button>
            </div>
        </form>
    );
}
