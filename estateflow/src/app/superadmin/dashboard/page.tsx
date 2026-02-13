'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users,
    Building2,
    DollarSign,
    TrendingUp,
    Loader2,
    UserPlus,
    AlertTriangle,
    CheckCircle,
    Crown,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';

interface PlatformStats {
    totalLandlords: number;
    totalTenants: number;
    totalGuards: number;
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    activeSubscriptions: number;
    mrr: number;
}

interface RecentLandlord {
    id: string;
    full_name: string;
    phone_number: string;
    created_at: string;
    email?: string;
    propertyCount?: number;
}

export default function SuperadminDashboard() {
    const [stats, setStats] = useState<PlatformStats>({
        totalLandlords: 0,
        totalTenants: 0,
        totalGuards: 0,
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        activeSubscriptions: 0,
        mrr: 0,
    });
    const [recentLandlords, setRecentLandlords] = useState<RecentLandlord[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchPlatformData();
    }, []);

    const fetchPlatformData = async () => {
        try {
            // Total landlords
            const { count: landlordCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'landlord');

            // Total tenants
            const { count: tenantCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'tenant');

            // Total guards
            const { count: guardCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'guard');

            // Total properties
            const { count: propertyCount } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true });

            // Total units and occupied
            const { data: units } = await supabase
                .from('units')
                .select('id, current_tenant_id');

            const unitsArr = units || [];
            const totalUnits = unitsArr.length;
            const occupiedUnits = unitsArr.filter((u: any) => u.current_tenant_id).length;

            // Active subscriptions and MRR
            let activeSubscriptions = 0;
            let mrr = 0;
            try {
                const { data: subs } = await supabase
                    .from('subscriptions')
                    .select('id, status, subscription_plans(price)')
                    .eq('status', 'active');

                if (subs) {
                    activeSubscriptions = subs.length;
                    mrr = subs.reduce((sum: number, s: any) => {
                        return sum + (s.subscription_plans?.price || 0);
                    }, 0);
                }
            } catch {
                // subscriptions table might not exist yet
            }

            setStats({
                totalLandlords: landlordCount || 0,
                totalTenants: tenantCount || 0,
                totalGuards: guardCount || 0,
                totalProperties: propertyCount || 0,
                totalUnits,
                occupiedUnits,
                activeSubscriptions,
                mrr,
            });

            // Recent landlords
            const { data: landlords } = await supabase
                .from('profiles')
                .select('id, full_name, phone_number, created_at')
                .eq('role', 'landlord')
                .order('created_at', { ascending: false })
                .limit(5);

            if (landlords) {
                // Get property counts for each landlord
                const enriched = await Promise.all(
                    landlords.map(async (l: any) => {
                        const { count } = await supabase
                            .from('properties')
                            .select('*', { count: 'exact', head: true })
                            .eq('landlord_id', l.id);
                        return { ...l, propertyCount: count || 0 };
                    })
                );
                setRecentLandlords(enriched);
            }
        } catch (error) {
            console.error('Error fetching platform data:', error);
        } finally {
            setLoading(false);
        }
    };

    const occupancyRate = stats.totalUnits > 0
        ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Crown className="text-amber-500" size={24} />
                        <span className="text-amber-500 text-sm font-medium uppercase tracking-wider">Super Admin</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Platform Overview</h1>
                    <p className="text-slate-400 mt-1">Monitor your SaaS platform performance</p>
                </div>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-amber-500/10 p-3 rounded-lg">
                            <Users className="text-amber-500" size={24} />
                        </div>
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <ArrowUpRight size={14} />
                            Active
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalLandlords}</p>
                    <p className="text-slate-400 text-sm mt-1">Total Landlords</p>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-500/10 p-3 rounded-lg">
                            <Building2 className="text-green-500" size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.totalProperties}</p>
                    <p className="text-slate-400 text-sm mt-1">Total Properties</p>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-500/10 p-3 rounded-lg">
                            <DollarSign className="text-purple-500" size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">KES {stats.mrr.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm mt-1">Monthly Recurring Revenue</p>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-500/10 p-3 rounded-lg">
                            <TrendingUp className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.activeSubscriptions}</p>
                    <p className="text-slate-400 text-sm mt-1">Active Subscriptions</p>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <p className="text-slate-400 text-xs mb-1">Total Tenants</p>
                    <p className="text-xl font-bold text-white">{stats.totalTenants}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <p className="text-slate-400 text-xs mb-1">Total Guards</p>
                    <p className="text-xl font-bold text-white">{stats.totalGuards}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <p className="text-slate-400 text-xs mb-1">Total Units</p>
                    <p className="text-xl font-bold text-white">{stats.totalUnits}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <p className="text-slate-400 text-xs mb-1">Occupancy Rate</p>
                    <p className="text-xl font-bold text-white">{occupancyRate}%</p>
                </div>
            </div>

            {/* Recent Landlords + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Landlords */}
                <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Recent Landlords</h2>
                        <Link
                            href="/superadmin/landlords"
                            className="text-amber-500 text-sm hover:text-amber-400 transition-colors"
                        >
                            View all →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentLandlords.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No landlords registered yet.</p>
                        ) : (
                            recentLandlords.map((landlord) => (
                                <div
                                    key={landlord.id}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {landlord.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {landlord.full_name || 'Unnamed'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {landlord.phone_number || 'No phone'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">
                                            {landlord.propertyCount} {landlord.propertyCount === 1 ? 'property' : 'properties'}
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            {new Date(landlord.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Platform Health */}
                <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                    <h2 className="text-lg font-semibold text-white mb-6">Platform Health</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <CheckCircle className="text-emerald-500" size={20} />
                            <div>
                                <p className="text-sm text-emerald-400 font-medium">System Online</p>
                                <p className="text-xs text-emerald-600">All services operational</p>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-400">Users</p>
                                <p className="text-xs text-white font-medium">
                                    {stats.totalLandlords + stats.totalTenants + stats.totalGuards}
                                </p>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-amber-500 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (stats.totalLandlords + stats.totalTenants + stats.totalGuards))}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-400">Occupancy</p>
                                <p className="text-xs text-white font-medium">{occupancyRate}%</p>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${occupancyRate}%` }}
                                />
                            </div>
                        </div>

                        <Link
                            href="/superadmin/analytics"
                            className="block w-full text-center py-2 mt-2 text-sm text-amber-500 hover:text-amber-400 border border-slate-700 rounded-lg hover:border-amber-500/50 transition-colors"
                        >
                            View Analytics →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
