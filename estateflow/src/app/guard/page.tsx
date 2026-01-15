'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Shield,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    User,
    Building,
    Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GuardVerifyPage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        unit?: string;
        visitor?: string;
        property?: string;
    } | null>(null);
    const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
    const [bannedVisitors, setBannedVisitors] = useState<any[]>([]);
    const [stats, setStats] = useState({ today: 0, denied: 0 });
    const [loadingData, setLoadingData] = useState(true);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: history } = await supabase
                .from('gate_passes')
                .select('*, units(unit_number, properties(name))')
                .eq('guard_id', user.id)
                .eq('status', 'used')
                .order('entry_time', { ascending: false })
                .limit(10);
            setRecentVerifications(history || []);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCount = (history || []).filter((h) => new Date(h.entry_time) >= today).length;
            setStats({ today: todayCount, denied: 0 });

            const { data: assignments } = await supabase
                .from('property_guards')
                .select('property_id')
                .eq('guard_id', user.id)
                .eq('is_active', true);

            if (assignments && assignments.length > 0) {
                const propertyIds = assignments.map((a) => a.property_id);
                const { data: banned } = await supabase
                    .from('banned_visitors')
                    .select('*')
                    .in('property_id', propertyIds);
                setBannedVisitors(banned || []);
            }

            setLoadingData(false);
        };

        fetchData();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) return;

        setLoading(true);
        setResult(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setResult({ success: false, message: 'Not authenticated' });
            setLoading(false);
            return;
        }

        const { data: pass, error } = await supabase
            .from('gate_passes')
            .select('*, units(unit_number, properties(name))')
            .eq('access_code', code)
            .eq('status', 'active')
            .gt('valid_until', new Date().toISOString())
            .single();

        if (error || !pass) {
            setResult({ success: false, message: 'Invalid or expired code' });
            setStats({ ...stats, denied: stats.denied + 1 });
            setLoading(false);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            return;
        }

        if (pass.visitor_name) {
            const isBanned = bannedVisitors.some(
                (b) => b.visitor_name?.toLowerCase().includes(pass.visitor_name?.toLowerCase())
            );
            if (isBanned) {
                setResult({ success: false, message: 'BLOCKED - Visitor is banned', visitor: pass.visitor_name });
                setStats({ ...stats, denied: stats.denied + 1 });
                setLoading(false);
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                return;
            }
        }

        await supabase
            .from('gate_passes')
            .update({ status: 'used', entry_time: new Date().toISOString(), guard_id: user.id })
            .eq('id', pass.id);

        const newEntry = { ...pass, status: 'used', entry_time: new Date().toISOString() };
        setRecentVerifications([newEntry, ...recentVerifications.slice(0, 9)]);
        setStats({ ...stats, today: stats.today + 1 });

        setResult({
            success: true,
            message: 'ACCESS GRANTED',
            unit: `Unit ${pass.units?.unit_number}`,
            visitor: pass.visitor_name || 'Guest',
            property: pass.units?.properties?.name,
        });

        if (navigator.vibrate) navigator.vibrate(100);
        setCode('');
        setLoading(false);
        setTimeout(() => setResult(null), 8000);
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Verify Visitor Code</h1>
                <p className="text-slate-600 mt-1">Enter the 6-digit code provided by the tenant</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Verified Today</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <XCircle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Denied Today</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.denied}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Banned Visitors</p>
                            <p className="text-2xl font-bold text-slate-900">{bannedVisitors.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Verification Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-slate-200">
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Enter 6-Digit Visitor Code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className="w-full text-center text-4xl sm:text-5xl font-mono tracking-[0.3em] py-6 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-slate-900 placeholder:text-slate-300"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className={`w-full py-4 sm:py-5 rounded-xl text-lg sm:text-xl font-bold transition-all flex items-center justify-center gap-3 ${code.length === 6
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        <Shield size={22} />
                                        VERIFY CODE
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Result Display */}
                        {result && (
                            <div className={`mt-6 p-6 rounded-xl text-center border-2 ${result.success
                                    ? 'bg-green-50 border-green-200'
                                    : result.message.includes('BLOCKED')
                                        ? 'bg-amber-50 border-amber-200'
                                        : 'bg-red-50 border-red-200'
                                }`}>
                                {result.success ? (
                                    <CheckCircle className="mx-auto mb-3 text-green-600" size={56} />
                                ) : result.message.includes('BLOCKED') ? (
                                    <AlertTriangle className="mx-auto mb-3 text-amber-600" size={56} />
                                ) : (
                                    <XCircle className="mx-auto mb-3 text-red-600" size={56} />
                                )}
                                <p className={`text-2xl sm:text-3xl font-bold ${result.success ? 'text-green-700' : result.message.includes('BLOCKED') ? 'text-amber-700' : 'text-red-700'
                                    }`}>
                                    {result.message}
                                </p>
                                {result.success && (
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center justify-center gap-2 text-lg sm:text-xl text-green-600">
                                            <User size={22} />
                                            <span>{result.visitor}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-green-500">
                                            <Building size={18} />
                                            <span>{result.unit} • {result.property}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Clock size={18} className="text-slate-400" />
                            Recent Verifications
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 sm:max-h-96 overflow-y-auto">
                        {recentVerifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No verifications yet</p>
                            </div>
                        ) : (
                            recentVerifications.map((entry) => (
                                <div key={entry.id} className="p-3 sm:p-4 flex items-center gap-3 hover:bg-slate-50">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="text-green-600" size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-slate-900 truncate">
                                            {entry.visitor_name || 'Guest'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Unit {entry.units?.unit_number}
                                        </p>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {new Date(entry.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
