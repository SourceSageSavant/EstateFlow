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
    MapPin,
    Mic,
    MicOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { speak } from '@/utils/textToSpeech';

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

const PHONETIC_MAP: Record<string, string> = {
    'ALPHA': 'A', 'BRAVO': 'B', 'CHARLIE': 'C', 'DELTA': 'D', 'ECHO': 'E',
    'FOXTROT': 'F', 'GOLF': 'G', 'HOTEL': 'H', 'INDIA': 'I', 'JULIET': 'J',
    'KILO': 'K', 'LIMA': 'L', 'MIKE': 'M', 'NOVEMBER': 'N', 'OSCAR': 'O',
    'PAPA': 'P', 'QUEBEC': 'Q', 'ROMEO': 'R', 'SIERRA': 'S', 'TANGO': 'T',
    'UNIFORM': 'U', 'VICTOR': 'V', 'WHISKEY': 'W', 'XRAY': 'X', 'YANKEE': 'Y', 'ZULU': 'Z',
    'ZERO': '0', 'ONE': '1', 'TWO': '2', 'THREE': '3', 'FOUR': '4',
    'FIVE': '5', 'SIX': '6', 'SEVEN': '7', 'EIGHT': '8', 'NINE': '9'
};

export default function GuardVerifyPage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
    const [stats, setStats] = useState({ today: 0, denied: 0 });
    const [loadingData, setLoadingData] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);

    const { isListening, transcript, startListening, stopListening, isSupported: isVoiceSupported } = useVoiceInput();
    const supabase = createClient();
    const router = useRouter();

    // Handle Voice Input
    useEffect(() => {
        if (transcript) {
            let processed = transcript.toUpperCase();

            // Replace phonetic words
            Object.entries(PHONETIC_MAP).forEach(([word, char]) => {
                const regex = new RegExp(`\\b${word}\\b`, 'g');
                processed = processed.replace(regex, char);
            });

            // Remove spaces and non-alphanumeric chars
            const cleanCode = processed.replace(/[^A-Z0-9]/g, '');

            if (cleanCode.length > 0) {
                // If we detect a potential code (e.g. 6 chars), set it
                // We append if the code looks partial, or replace if it looks new?
                // Simplest strategy: Replace code.
                setCode(cleanCode.slice(0, 6));
            }
        }
    }, [transcript]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch recent check-ins
            // @ts-ignore
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

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (code.length < 6) {
            toast.error('Enter a valid 6-character code');
            speak('Enter a valid code');
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
                speak('Access Denied. Invalid Code.');
            } else {
                if (navigator.vibrate) navigator.vibrate(100);
                toast.success('Pass verified!');
                speak(`Access Granted. Visitor ${data.pass.visitorName}`);
            }
        } catch (error) {
            toast.error('Verification failed');
            setVerifyResult({ valid: false, message: 'Network error' });
            speak('Verification failed. Network error.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!verifyResult?.pass?.id) return;

        setCheckingIn(true);
        let location = null;

        // Try to get location
        if (navigator.geolocation) {
            const toastId = toast.loading('Getting location...');
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });
                location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                toast.dismiss(toastId);
            } catch (error) {
                console.error('Location error:', error);
                toast.dismiss(toastId);
                toast('Location access denied. Proceeding without it.', { icon: '📍' });
            }
        }

        try {
            const response = await fetch('/api/passes/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passId: verifyResult.pass.id,
                    location
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Visitor checked in!');
                speak('Checked in successfully');
                if (navigator.vibrate) navigator.vibrate(200);
                setStats(prev => ({ ...prev, today: prev.today + 1 }));
                setVerifyResult(null);
                setCode('');

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
                speak('Check in failed');
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
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
                speak('Visitor checked out');
                setVerifyResult(null);
                setCode('');
            } else {
                toast.error(data.error || 'Check-out failed');
                speak('Check out failed');
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
                <p className="text-slate-600 mt-1">Enter code manually or use voice command</p>
            </div>

            {/* Verification Panel */}
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-slate-200">
                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Enter 6-Character Visitor Code
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                placeholder="A B C 1 2 3"
                                className="w-full text-center text-4xl sm:text-5xl font-mono tracking-[0.3em] py-6 px-12 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-slate-900 placeholder:text-slate-300 transition-colors"
                                autoFocus
                            />
                            {isVoiceSupported && (
                                <button
                                    type="button"
                                    onClick={isListening ? stopListening : startListening}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${isListening
                                            ? 'bg-red-100 text-red-600 animate-pulse'
                                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                        }`}
                                    title="Voice Input"
                                >
                                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>
                            )}
                        </div>
                        {isListening && (
                            <p className="text-center text-sm text-indigo-600 mt-2 font-medium animate-pulse">
                                Listening... Say "Alpha Bravo..." or just letters
                            </p>
                        )}
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

                                        <div className="flex items-center gap-3 text-green-600">
                                            <Building size={18} />
                                            <span>{verifyResult.pass.property} • Unit {verifyResult.pass.unit}</span>
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
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats - Simplified for space */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <CheckCircle className="text-green-600" />
                    <div>
                        <p className="text-xs text-slate-500">Verified</p>
                        <p className="text-xl font-bold">{stats.today}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <XCircle className="text-red-600" />
                    <div>
                        <p className="text-xs text-slate-500">Denied</p>
                        <p className="text-xl font-bold">{stats.denied}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
