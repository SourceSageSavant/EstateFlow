'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import {
    Shield,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    User,
    Building,
    Clock,
    Phone,
    Car,
    LogIn,
    LogOut,
    FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VerifyResult {
    valid: boolean;
    message: string;
    pass?: {
        id: string;
        accessCode: string;
        visitorName: string;
        visitorPhone?: string;
        visitorIdNumber?: string;
        visitorVehicle?: string;
        purpose?: string;
        validFrom: string;
        validUntil: string;
        status: string;
        property?: string;
        propertyAddress?: string;
        unit?: string;
        tenantName?: string;
        tenantPhone?: string;
        checkedInAt?: string;
    };
    error?: string;
}

export default function GuardVerifyPage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
    const [stats, setStats] = useState({ today: 0, denied: 0 });
    const [loadingData, setLoadingData] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch recent check-ins for this guard
            // @ts-ignore - gate_passes table not in types yet
            const { data: history } = await supabase
                .from('gate_passes')
                .select('*, properties(name), units(unit_number)')
                .eq('checked_in_by', user.id)
                .order('checked_in_at', { ascending: false })
                .limit(10);
            setRecentVerifications(history || []);

            // Count today's verifications
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCount = (history || []).filter((h: any) =>
                h.checked_in_at && new Date(h.checked_in_at) >= today
            ).length;
            setStats({ today: todayCount, denied: 0 });

            setLoadingData(false);
        };

        fetchData();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) {
            toast.error('Enter a valid 6-character code');
            return;
        }

        setLoading(true);
        setVerifyResult(null);

        try {
            const response = await fetch('/api/passes/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode: code.toUpperCase() }),
            });

            const data = await response.json();
            setVerifyResult(data);

            if (!data.valid) {
                setStats(prev => ({ ...prev, denied: prev.denied + 1 }));
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                toast.error(data.message || 'Invalid code');
            } else {
                if (navigator.vibrate) navigator.vibrate(100);
                toast.success('Pass verified!');
            }
        } catch (error) {
            toast.error('Verification failed');
            setVerifyResult({ valid: false, message: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!verifyResult?.pass?.id) return;

        setCheckingIn(true);
        try {
            const response = await fetch('/api/passes/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: verifyResult.pass.id }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Visitor checked in!');
                setStats(prev => ({ ...prev, today: prev.today + 1 }));
                setVerifyResult(null);
                setCode('');

                // Add to recent verifications
                const newEntry = {
                    id: verifyResult.pass.id,
                    visitor_name: verifyResult.pass.visitorName,
                    checked_in_at: new Date().toISOString(),
                    status: 'checked_in',
                    properties: { name: verifyResult.pass.property },
                    units: { unit_number: verifyResult.pass.unit },
                };
                setRecentVerifications(prev => [newEntry, ...prev.slice(0, 9)]);
            } else {
                toast.error(data.error || 'Check-in failed');
            }
        } catch (error) {
            toast.error('Check-in failed');
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        if (!verifyResult?.pass?.id) return;

        setCheckingOut(true);
        try {
            const response = await fetch('/api/passes/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passId: verifyResult.pass.id }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Visitor checked out!');
                setVerifyResult(null);
                setCode('');
            } else {
                toast.error(data.error || 'Check-out failed');
            }
        } catch (error) {
            toast.error('Check-out failed');
        } finally {
            setCheckingOut(false);
        }
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
                <p className="text-slate-600 mt-1">Enter the 6-character code provided by the tenant</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-slate-500">Verified Today</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.today}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <XCircle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-slate-500">Denied</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-900">{stats.denied}</p>
                        </div>
                    </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Shield className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-slate-500">On Duty</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">Active</p>
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
                                    Enter 6-Character Visitor Code
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    placeholder="ABC123"
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
                        {verifyResult && (
                            <div className={`mt-6 p-6 rounded-xl border-2 ${verifyResult.valid
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                                }`}>
                                {verifyResult.valid ? (
                                    <>
                                        <div className="text-center mb-4">
                                            <CheckCircle className="mx-auto mb-3 text-green-600" size={56} />
                                            <p className="text-2xl sm:text-3xl font-bold text-green-700">
                                                PASS VALID
                                            </p>
                                        </div>

                                        {verifyResult.pass && (
                                            <div className="space-y-3 mt-4 pt-4 border-t border-green-200">
                                                <div className="flex items-center gap-3 text-green-700">
                                                    <User size={20} />
                                                    <span className="font-semibold text-lg">{verifyResult.pass.visitorName}</span>
                                                </div>

                                                {verifyResult.pass.visitorPhone && (
                                                    <div className="flex items-center gap-3 text-green-600">
                                                        <Phone size={18} />
                                                        <span>{verifyResult.pass.visitorPhone}</span>
                                                    </div>
                                                )}

                                                {verifyResult.pass.visitorVehicle && (
                                                    <div className="flex items-center gap-3 text-green-600">
                                                        <Car size={18} />
                                                        <span>{verifyResult.pass.visitorVehicle}</span>
                                                    </div>
                                                )}

                                                {verifyResult.pass.purpose && (
                                                    <div className="flex items-center gap-3 text-green-600">
                                                        <FileText size={18} />
                                                        <span>{verifyResult.pass.purpose}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 text-green-600">
                                                    <Building size={18} />
                                                    <span>{verifyResult.pass.property} • Unit {verifyResult.pass.unit}</span>
                                                </div>

                                                <div className="flex items-center gap-3 text-green-600">
                                                    <Clock size={18} />
                                                    <span>Valid until {new Date(verifyResult.pass.validUntil).toLocaleString()}</span>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-3 mt-6 pt-4 border-t border-green-200">
                                                    {verifyResult.pass.status === 'pending' && (
                                                        <button
                                                            onClick={handleCheckIn}
                                                            disabled={checkingIn}
                                                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
                                                        >
                                                            {checkingIn ? (
                                                                <Loader2 className="animate-spin" size={20} />
                                                            ) : (
                                                                <>
                                                                    <LogIn size={20} />
                                                                    CHECK IN
                                                                </>
                                                            )}
                                                        </button>
                                                    )}

                                                    {verifyResult.pass.status === 'checked_in' && (
                                                        <button
                                                            onClick={handleCheckOut}
                                                            disabled={checkingOut}
                                                            className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 flex items-center justify-center gap-2"
                                                        >
                                                            {checkingOut ? (
                                                                <Loader2 className="animate-spin" size={20} />
                                                            ) : (
                                                                <>
                                                                    <LogOut size={20} />
                                                                    CHECK OUT
                                                                </>
                                                            )}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => { setVerifyResult(null); setCode(''); }}
                                                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <XCircle className="mx-auto mb-3 text-red-600" size={56} />
                                        <p className="text-2xl sm:text-3xl font-bold text-red-700">
                                            {verifyResult.message || 'INVALID CODE'}
                                        </p>
                                        <p className="text-red-600 mt-2">{verifyResult.error}</p>
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
                            Recent Check-ins
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-80 sm:max-h-96 overflow-y-auto">
                        {recentVerifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No check-ins yet</p>
                            </div>
                        ) : (
                            recentVerifications.map((entry) => (
                                <div key={entry.id} className="p-3 sm:p-4 flex items-center gap-3 hover:bg-slate-50">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.status === 'checked_out' ? 'bg-slate-100' : 'bg-green-100'
                                        }`}>
                                        {entry.status === 'checked_out' ? (
                                            <LogOut className="text-slate-600" size={18} />
                                        ) : (
                                            <LogIn className="text-green-600" size={18} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-slate-900 truncate">
                                            {entry.visitor_name || 'Guest'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {entry.properties?.name} • Unit {entry.units?.unit_number}
                                        </p>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {entry.checked_in_at && new Date(entry.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
