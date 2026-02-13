'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Building2,
    Loader2,
    Search,
    MapPin,
    Users,
    Home,
} from 'lucide-react';

interface Property {
    id: string;
    name: string;
    address: string;
    total_units: number;
    is_active: boolean;
    created_at: string;
    landlord: {
        full_name: string;
    };
    occupiedUnits: number;
}

export default function AllPropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const { data } = await supabase
                .from('properties')
                .select('id, name, address, total_units, is_active, created_at, profiles:landlord_id(full_name)')
                .order('created_at', { ascending: false });

            if (data) {
                const enriched = await Promise.all(
                    data.map(async (p: any) => {
                        const { data: units } = await supabase
                            .from('units')
                            .select('id, current_tenant_id')
                            .eq('property_id', p.id);

                        return {
                            ...p,
                            landlord: p.profiles || { full_name: 'Unknown' },
                            occupiedUnits: units?.filter((u: any) => u.current_tenant_id).length || 0,
                            total_units: units?.length || p.total_units || 0,
                        };
                    })
                );
                setProperties(enriched);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = properties.filter((p) => {
        const q = searchQuery.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q) || p.landlord?.full_name?.toLowerCase().includes(q);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">All Properties</h1>
                <p className="text-slate-400 mt-1">Overview of all properties across the platform</p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Search by property name, address, or landlord..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((property) => (
                    <div key={property.id} className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500/10 p-2 rounded-lg">
                                    <Building2 className="text-amber-500" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">{property.name}</h3>
                                    <p className="text-slate-500 text-xs flex items-center gap-1">
                                        <MapPin size={12} /> {property.address}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${property.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {property.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Home size={12} />
                                {property.occupiedUnits}/{property.total_units} occupied
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Users size={12} />
                                {property.landlord?.full_name}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
                    <Building2 className="text-slate-600 mx-auto mb-4" size={48} />
                    <p className="text-slate-400">No properties found.</p>
                </div>
            )}
        </div>
    );
}
