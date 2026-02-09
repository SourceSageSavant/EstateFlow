'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    Building2,
    Users,
    DollarSign,
    AlertCircle,
    Loader2,
    Key,
    FileText,
    TrendingUp,
    Home,
    Clock,
    CheckCircle,
    ChevronRight,
    Wrench,
    CreditCard,
} from 'lucide-react';

interface DashboardStats {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    activeTenants: number;
    revenueThisMonth: number;
    pendingMaintenance: number;
    activeGatePasses: number;
    pendingLeases: number;
}

interface RecentActivity {
    id: string;
    type: 'payment' | 'maintenance' | 'pass' | 'lease';
    title: string;
    description: string;
    timestamp: string;
    status?: string;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        activeTenants: 0,
        revenueThisMonth: 0,
        pendingMaintenance: 0,
        activeGatePasses: 0,
        pendingLeases: 0,
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch properties count
            const { count: propertiesCount } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('landlord_id', user.id);

            // Fetch units data
            const { data: properties } = await supabase
                .from('properties')
                .select('id')
                .eq('landlord_id', user.id);

            const propertyIds = (properties as any[] || []).map((p: any) => p.id);

            let unitsData = { total: 0, occupied: 0 };
            if (propertyIds.length > 0) {
                const { data: units } = await supabase
                    .from('units')
                    .select('id, current_tenant_id')
                    .in('property_id', propertyIds);

                const unitsArr = units as any[] || [];
                unitsData = {
                    total: unitsArr.length,
                    occupied: unitsArr.filter((u: any) => u.current_tenant_id).length,
                };
            }

            // Fetch active tenants count
            const { count: tenantsCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'tenant');

            // Fetch revenue this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            let revenue = 0;
            if (propertyIds.length > 0) {
                const { data: payments } = await (supabase
                    .from('payment_transactions') as any)
                    .select('amount')
                    .in('property_id', propertyIds)
                    .eq('status', 'completed')
                    .gte('created_at', startOfMonth.toISOString());

                revenue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
            }

            // Fetch pending maintenance
            let pendingMaintenance = 0;
            if (propertyIds.length > 0) {
                const { data: units } = await supabase
                    .from('units')
                    .select('id')
                    .in('property_id', propertyIds);

                const unitIds = (units as any[] || []).map((u: any) => u.id);

                if (unitIds.length > 0) {
                    const { count } = await supabase
                        .from('maintenance_requests')
                        .select('*', { count: 'exact', head: true })
                        .in('unit_id', unitIds)
                        .in('status', ['pending', 'in_progress']);

                    pendingMaintenance = count || 0;
                }
            }

            // Fetch active gate passes
            let activeGatePasses = 0;
            if (propertyIds.length > 0) {
                const { count } = await (supabase
                    .from('gate_passes') as any)
                    .select('*', { count: 'exact', head: true })
                    .in('property_id', propertyIds)
                    .eq('status', 'active')
                    .gte('valid_until', new Date().toISOString());

                activeGatePasses = count || 0;
            }

            // Fetch pending leases
            let pendingLeases = 0;
            if (propertyIds.length > 0) {
                const { data: units } = await supabase
                    .from('units')
                    .select('id')
                    .in('property_id', propertyIds);

                const unitIds = (units as any[] || []).map((u: any) => u.id);

                if (unitIds.length > 0) {
                    const { count } = await (supabase
                        .from('leases') as any)
                        .select('*', { count: 'exact', head: true })
                        .in('unit_id', unitIds)
                        .eq('status', 'pending_signature');

                    pendingLeases = count || 0;
                }
            }

            setStats({
                totalProperties: propertiesCount || 0,
                totalUnits: unitsData.total,
                occupiedUnits: unitsData.occupied,
                activeTenants: tenantsCount || 0,
                revenueThisMonth: revenue,
                pendingMaintenance,
                activeGatePasses,
                pendingLeases,
            });

            // Fetch recent activity
            await fetchRecentActivity(propertyIds);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentActivity = async (propertyIds: string[]) => {
        const activities: RecentActivity[] = [];

        try {
            if (propertyIds.length === 0) {
                setRecentActivity([]);
                return;
            }

            // Get unit IDs for the properties
            const { data: units } = await supabase
                .from('units')
                .select('id')
                .in('property_id', propertyIds);
            const unitIds = (units as any[] || []).map((u: any) => u.id);

            // Recent payments
            const { data: payments } = await (supabase
                .from('payment_transactions') as any)
                .select('id, amount, status, created_at, tenant_id, profiles:tenant_id(full_name)')
                .in('property_id', propertyIds)
                .order('created_at', { ascending: false })
                .limit(3);

            payments?.forEach((p: any) => {
                activities.push({
                    id: `payment-${p.id}`,
                    type: 'payment',
                    title: 'Payment Received',
                    description: `KES ${p.amount?.toLocaleString()} from ${p.profiles?.full_name || 'Tenant'}`,
                    timestamp: p.created_at,
                    status: p.status,
                });
            });

            // Recent maintenance requests
            if (unitIds.length > 0) {
                const { data: maintenance } = await supabase
                    .from('maintenance_requests')
                    .select('id, title, status, created_at, units(unit_number, properties(name))')
                    .in('unit_id', unitIds)
                    .order('created_at', { ascending: false })
                    .limit(3);

                maintenance?.forEach((m: any) => {
                    activities.push({
                        id: `maint-${m.id}`,
                        type: 'maintenance',
                        title: m.title,
                        description: `${m.units?.properties?.name} - Unit ${m.units?.unit_number}`,
                        timestamp: m.created_at,
                        status: m.status,
                    });
                });
            }

            // Recent gate passes
            const { data: passes } = await (supabase
                .from('gate_passes') as any)
                .select('id, visitor_name, status, created_at, properties(name)')
                .in('property_id', propertyIds)
                .order('created_at', { ascending: false })
                .limit(3);

            passes?.forEach((p: any) => {
                activities.push({
                    id: `pass-${p.id}`,
                    type: 'pass',
                    title: 'Gate Pass Created',
                    description: `${p.visitor_name} at ${p.properties?.name}`,
                    timestamp: p.created_at,
                    status: p.status,
                });
            });

            // Sort by timestamp and take top 5
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setRecentActivity(activities.slice(0, 5));

        } catch (error) {
            console.error('Error fetching recent activity:', error);
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'payment': return <CreditCard className="text-green-600" size={16} />;
            case 'maintenance': return <Wrench className="text-amber-600" size={16} />;
            case 'pass': return <Key className="text-blue-600" size={16} />;
            case 'lease': return <FileText className="text-purple-600" size={16} />;
            default: return <Clock className="text-slate-400" size={16} />;
        }
    };

    const occupancyRate = stats.totalUnits > 0
        ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">Welcome back! Here&apos;s your property overview.</p>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500 p-3 rounded-lg">
                            <Building2 className="text-white" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-600 text-sm">Total Properties</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalProperties}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-500 p-3 rounded-lg">
                            <Users className="text-white" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-600 text-sm">Active Tenants</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.activeTenants}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-500 p-3 rounded-lg">
                            <DollarSign className="text-white" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-600 text-sm">Revenue (This Month)</p>
                            <p className="text-2xl font-bold text-slate-900">KES {stats.revenueThisMonth.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-500 p-3 rounded-lg">
                            <AlertCircle className="text-white" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-600 text-sm">Pending Maintenance</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.pendingMaintenance}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-700 text-xs font-medium">Occupancy Rate</p>
                            <p className="text-xl font-bold text-indigo-900">{occupancyRate}%</p>
                        </div>
                        <Home className="text-indigo-400" size={20} />
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">{stats.occupiedUnits}/{stats.totalUnits} units</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-700 text-xs font-medium">Active Passes</p>
                            <p className="text-xl font-bold text-emerald-900">{stats.activeGatePasses}</p>
                        </div>
                        <Key className="text-emerald-400" size={20} />
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">Valid gate passes</p>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-violet-700 text-xs font-medium">Pending Leases</p>
                            <p className="text-xl font-bold text-violet-900">{stats.pendingLeases}</p>
                        </div>
                        <FileText className="text-violet-400" size={20} />
                    </div>
                    <p className="text-xs text-violet-600 mt-1">Awaiting signature</p>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-rose-700 text-xs font-medium">Total Units</p>
                            <p className="text-xl font-bold text-rose-900">{stats.totalUnits}</p>
                        </div>
                        <Building2 className="text-rose-400" size={20} />
                    </div>
                    <p className="text-xs text-rose-600 mt-1">Across all properties</p>
                </div>
            </div>

            {/* Recent Activity / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No recent activity yet.</p>
                        ) : (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
                                        <p className="text-xs text-slate-500 truncate">{activity.description}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {formatTimeAgo(activity.timestamp)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/admin/properties"
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                        >
                            <Building2 className="text-indigo-600 mb-2" size={28} />
                            <span className="text-sm font-medium text-slate-700">Add Property</span>
                        </Link>
                        <Link
                            href="/admin/tenants"
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-green-50 rounded-lg border border-slate-200 hover:border-green-300 transition-colors"
                        >
                            <Users className="text-green-600 mb-2" size={28} />
                            <span className="text-sm font-medium text-slate-700">Add Tenant</span>
                        </Link>
                        <Link
                            href="/admin/leases/new"
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-purple-50 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors"
                        >
                            <FileText className="text-purple-600 mb-2" size={28} />
                            <span className="text-sm font-medium text-slate-700">New Lease</span>
                        </Link>
                        <Link
                            href="/admin/maintenance"
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors"
                        >
                            <Wrench className="text-amber-600 mb-2" size={28} />
                            <span className="text-sm font-medium text-slate-700">Maintenance</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
