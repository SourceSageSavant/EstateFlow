'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users,
    Search,
    Loader2,
    Building2,
    Ban,
    CheckCircle,
    MoreVertical,
    Eye,
    Mail,
    Phone,
    Calendar,
    Crown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface Landlord {
    id: string;
    full_name: string;
    phone_number: string;
    created_at: string;
    email?: string;
    propertyCount: number;
    unitCount: number;
    tenantCount: number;
    subscription?: {
        plan_name: string;
        status: string;
    };
    is_suspended: boolean;
}

export default function LandlordsPage() {
    const [landlords, setLandlords] = useState<Landlord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchLandlords();
    }, []);

    const fetchLandlords = async () => {
        try {
            // 1. Get all landlords
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, phone_number, created_at, email')
                .eq('role', 'landlord')
                .order('created_at', { ascending: false });

            if (!profiles || profiles.length === 0) {
                setLandlords([]);
                return;
            }

            const landlordIds = profiles.map((p: any) => p.id);

            // 2. Batch: Get ALL properties for all landlords at once
            const { data: allProperties } = await supabase
                .from('properties')
                .select('id, landlord_id')
                .in('landlord_id', landlordIds);

            // 3. Batch: Get ALL units for those properties at once
            const propertyIds = (allProperties || []).map((p: any) => p.id);
            let allUnits: any[] = [];
            if (propertyIds.length > 0) {
                const { data: unitData } = await supabase
                    .from('units')
                    .select('id, property_id, current_tenant_id')
                    .in('property_id', propertyIds);
                allUnits = unitData || [];
            }

            // 4. Batch: Get ALL subscriptions for all landlords at once
            const { data: allSubs } = await supabase
                .from('subscriptions')
                .select('landlord_id, status, subscription_plans(name)')
                .in('landlord_id', landlordIds);

            // --- Group data in JS (O(n) instead of N queries) ---
            const propsByLandlord = new Map<string, any[]>();
            (allProperties || []).forEach((p: any) => {
                const list = propsByLandlord.get(p.landlord_id) || [];
                list.push(p);
                propsByLandlord.set(p.landlord_id, list);
            });

            const propIdToLandlord = new Map<string, string>();
            (allProperties || []).forEach((p: any) => {
                propIdToLandlord.set(p.id, p.landlord_id);
            });

            const unitsByLandlord = new Map<string, any[]>();
            allUnits.forEach((u: any) => {
                const landlordId = propIdToLandlord.get(u.property_id);
                if (landlordId) {
                    const list = unitsByLandlord.get(landlordId) || [];
                    list.push(u);
                    unitsByLandlord.set(landlordId, list);
                }
            });

            const subByLandlord = new Map<string, any>();
            (allSubs || []).forEach((s: any) => {
                subByLandlord.set(s.landlord_id, s);
            });

            // Build enriched landlord data
            const enriched = profiles.map((profile: any) => {
                const props = propsByLandlord.get(profile.id) || [];
                const units = unitsByLandlord.get(profile.id) || [];
                const sub = subByLandlord.get(profile.id);

                return {
                    ...profile,
                    propertyCount: props.length,
                    unitCount: units.length,
                    tenantCount: units.filter((u: any) => u.current_tenant_id).length,
                    subscription: sub ? {
                        plan_name: sub.subscription_plans?.name || 'Free',
                        status: sub.status,
                    } : undefined,
                    is_suspended: false,
                };
            });

            setLandlords(enriched);
        } catch (error) {
            console.error('Error fetching landlords:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLandlords = landlords.filter((l) => {
        const query = searchQuery.toLowerCase();
        return (
            l.full_name?.toLowerCase().includes(query) ||
            l.phone_number?.toLowerCase().includes(query)
        );
    });

    const handleViewDetails = (landlord: Landlord) => {
        setSelectedLandlord(landlord);
        setShowDetailModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Landlords</h1>
                    <p className="text-slate-400 mt-1">Manage all registered landlords on the platform</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
                        {landlords.length} total
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left py-4 px-6 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Landlord
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Properties
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Units / Tenants
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="text-right py-4 px-6 text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredLandlords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        {searchQuery ? 'No landlords match your search.' : 'No landlords registered yet.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredLandlords.map((landlord) => (
                                    <tr
                                        key={landlord.id}
                                        className="hover:bg-slate-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {landlord.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {landlord.full_name || 'Unnamed'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {landlord.phone_number || 'No phone'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="text-slate-500" size={14} />
                                                <span className="text-sm text-slate-300">{landlord.propertyCount}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-slate-300">
                                                {landlord.unitCount} / {landlord.tenantCount}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${landlord.subscription?.plan_name === 'Enterprise' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    landlord.subscription?.plan_name === 'Professional' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                        landlord.subscription?.plan_name === 'Starter' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            'bg-slate-700 text-slate-400 border border-slate-600'
                                                }`}>
                                                {landlord.subscription?.plan_name || 'Free'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-slate-400">
                                                {new Date(landlord.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => handleViewDetails(landlord)}
                                                className="text-amber-500 hover:text-amber-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLandlord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {selectedLandlord.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedLandlord.full_name || 'Unnamed'}</h2>
                                    <p className="text-sm text-slate-400">Landlord</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-slate-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-white">{selectedLandlord.propertyCount}</p>
                                    <p className="text-xs text-slate-400">Properties</p>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-white">{selectedLandlord.unitCount}</p>
                                    <p className="text-xs text-slate-400">Units</p>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-white">{selectedLandlord.tenantCount}</p>
                                    <p className="text-xs text-slate-400">Tenants</p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="text-slate-500" size={16} />
                                    <span className="text-slate-300">{selectedLandlord.phone_number || 'Not provided'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="text-slate-500" size={16} />
                                    <span className="text-slate-300">Joined {new Date(selectedLandlord.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Crown className="text-slate-500" size={16} />
                                    <span className="text-slate-300">Plan: {selectedLandlord.subscription?.plan_name || 'Free'}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="w-full py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
