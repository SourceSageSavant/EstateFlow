'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    BarChart3,
    Loader2,
    Users,
    Building2,
    TrendingUp,
    Calendar,
} from 'lucide-react';

interface MonthlyData {
    month: string;
    landlords: number;
    properties: number;
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyData[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // Get all landlords with their creation dates
            const { data: landlords } = await supabase
                .from('profiles')
                .select('created_at')
                .eq('role', 'landlord')
                .order('created_at', { ascending: true });

            const { data: properties } = await supabase
                .from('properties')
                .select('created_at')
                .order('created_at', { ascending: true });

            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            setTotalUsers(userCount || 0);

            // Group by month
            const months: Record<string, { landlords: number; properties: number }> = {};
            const now = new Date();

            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
                months[key] = { landlords: 0, properties: 0 };
            }

            landlords?.forEach((l: any) => {
                const d = new Date(l.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (months[key] !== undefined) months[key].landlords++;
            });

            properties?.forEach((p: any) => {
                const d = new Date(p.created_at);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (months[key] !== undefined) months[key].properties++;
            });

            const data = Object.entries(months).map(([key, val]) => {
                const d = new Date(key + '-01');
                return {
                    month: d.toLocaleDateString('en', { month: 'short' }),
                    ...val,
                };
            });

            setMonthlyGrowth(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const maxVal = Math.max(...monthlyGrowth.map((m) => Math.max(m.landlords, m.properties)), 1);

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
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-slate-400 mt-1">Platform growth and usage trends</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-amber-500" size={20} />
                        <span className="text-slate-400 text-sm">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalUsers}</p>
                </div>
                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-green-500" size={20} />
                        <span className="text-slate-400 text-sm">This Month Signups</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {monthlyGrowth[monthlyGrowth.length - 1]?.landlords || 0}
                    </p>
                </div>
                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="text-purple-500" size={20} />
                        <span className="text-slate-400 text-sm">New Properties</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {monthlyGrowth[monthlyGrowth.length - 1]?.properties || 0}
                    </p>
                </div>
            </div>

            {/* Growth Chart (CSS Bar Chart) */}
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h2 className="text-lg font-semibold text-white mb-6">Growth - Last 6 Months</h2>

                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-xs text-slate-400">Landlords</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-purple-500" />
                        <span className="text-xs text-slate-400">Properties</span>
                    </div>
                </div>

                <div className="flex items-end justify-between gap-2 h-48">
                    {monthlyGrowth.map((m, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex gap-1 items-end justify-center" style={{ height: '160px' }}>
                                <div
                                    className="w-5 bg-amber-500 rounded-t transition-all"
                                    style={{ height: `${Math.max(4, (m.landlords / maxVal) * 160)}px` }}
                                    title={`${m.landlords} landlords`}
                                />
                                <div
                                    className="w-5 bg-purple-500 rounded-t transition-all"
                                    style={{ height: `${Math.max(4, (m.properties / maxVal) * 160)}px` }}
                                    title={`${m.properties} properties`}
                                />
                            </div>
                            <span className="text-xs text-slate-500">{m.month}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
