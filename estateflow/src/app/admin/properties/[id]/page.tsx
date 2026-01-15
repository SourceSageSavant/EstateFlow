'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Building2,
    MapPin,
    Home,
    Users,
    ArrowLeft,
    Edit,
    Trash2,
    Loader2,
    Plus,
    Calendar,
    DollarSign,
} from 'lucide-react';

export default function PropertyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        // Fetch property
        const { data: propertyData } = await supabase
            .from('properties')
            .select('*')
            .eq('id', params.id)
            .single();

        setProperty(propertyData);

        // Fetch units
        const { data: unitsData } = await supabase
            .from('units')
            .select('*, current_tenant:profiles(full_name, email)')
            .eq('property_id', params.id)
            .order('unit_number');

        setUnits(unitsData || []);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-slate-900">Property not found</h2>
                <Link href="/admin/properties" className="text-indigo-600 hover:underline mt-2 inline-block">
                    Back to Properties
                </Link>
            </div>
        );
    }

    const occupiedUnits = units.filter(u => u.current_tenant_id).length;
    const vacantUnits = units.filter(u => !u.current_tenant_id).length;
    const totalRent = units.reduce((sum, u) => sum + (u.rent_amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href="/admin/properties"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft size={20} />
                Back to Properties
            </Link>

            {/* Property Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Building2 className="text-indigo-600" size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
                            <p className="text-slate-500 flex items-center gap-1 mt-1">
                                <MapPin size={16} />
                                {property.address}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/admin/properties/${property.id}/units`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <Home size={18} />
                            Manage Units
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Home className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Units</p>
                            <p className="text-xl font-bold text-slate-900">{property.total_units}</p>
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
                            <p className="text-xl font-bold text-slate-900">{occupiedUnits}</p>
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
                            <p className="text-xl font-bold text-slate-900">{vacantUnits}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Potential Rent</p>
                            <p className="text-xl font-bold text-slate-900">KES {totalRent.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Units List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Units Overview</h2>
                    <Link
                        href={`/admin/properties/${property.id}/units`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        View All →
                    </Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {units.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Home className="mx-auto mb-2 text-slate-300" size={32} />
                            <p>No units added yet</p>
                            <Link
                                href={`/admin/properties/${property.id}/units`}
                                className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                            >
                                Add units now
                            </Link>
                        </div>
                    ) : (
                        units.slice(0, 5).map((unit) => (
                            <div key={unit.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${unit.current_tenant_id ? 'bg-green-100' : 'bg-slate-100'
                                        }`}>
                                        <Home className={unit.current_tenant_id ? 'text-green-600' : 'text-slate-400'} size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Unit {unit.unit_number}</p>
                                        <p className="text-sm text-slate-500">
                                            KES {unit.rent_amount?.toLocaleString()}/mo
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {unit.current_tenant ? (
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{unit.current_tenant.full_name}</p>
                                            <p className="text-xs text-slate-500">{unit.current_tenant.email}</p>
                                        </div>
                                    ) : (
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Vacant</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
