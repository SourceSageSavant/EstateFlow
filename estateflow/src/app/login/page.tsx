'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, ArrowLeft, Mail, CheckCircle, Eye, EyeOff, User, Phone } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
    const [mode, setMode] = useState<Mode>('login');
    const [resetSent, setResetSent] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const clearForm = () => {
        setMessage(null);
        setEmail('');
        setPassword('');
        setFullName('');
        setPhoneNumber('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setMessage({ text: error.message, type: 'error' });
                return;
            }

            // Fetch user profile to get role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            const role = profile?.role || 'landlord';

            const dashboardMap: Record<string, string> = {
                superadmin: '/superadmin/dashboard',
                landlord: '/admin/dashboard',
                tenant: '/tenant',
                guard: '/guard',
            };

            router.refresh();
            router.push(dashboardMap[role] || '/admin/dashboard');
        } catch {
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Validation
        if (password.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
            setLoading(false);
            return;
        }

        if (!fullName.trim()) {
            setMessage({ text: 'Please enter your full name', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            // 1. Create auth user
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        full_name: fullName.trim(),
                        phone_number: phoneNumber.trim(),
                    },
                },
            });

            if (error) {
                setMessage({ text: error.message, type: 'error' });
                setLoading(false);
                return;
            }

            if (data.user) {
                // 2. Create/update profile as landlord
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        role: 'landlord',
                        full_name: fullName.trim(),
                        phone_number: phoneNumber.trim() || null,
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                }

                // 3. Assign free plan subscription
                try {
                    const { data: freePlan } = await supabase
                        .from('subscription_plans')
                        .select('id')
                        .eq('name', 'Free')
                        .single();

                    if (freePlan) {
                        await supabase
                            .from('subscriptions')
                            .upsert({
                                user_id: data.user.id,
                                plan_id: freePlan.id,
                                status: 'active',
                                current_period_start: new Date().toISOString(),
                            }, { onConflict: 'user_id' });
                    }
                } catch {
                    // subscription tables might not exist yet - that's ok
                }

                // Check if email confirmation is required
                if (data.session) {
                    // Auto-confirmed (e.g., email confirmation disabled in Supabase)
                    router.refresh();
                    router.push('/admin/dashboard');
                } else {
                    setMessage({
                        text: 'Account created! Check your email for the confirmation link.',
                        type: 'success',
                    });
                }
            }
        } catch {
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
            });

            if (error) {
                setMessage({ text: error.message, type: 'error' });
            } else {
                setResetSent(true);
            }
        } catch {
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot Password View ──
    if (mode === 'forgot') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
                    {resetSent ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
                            <p className="text-gray-600">
                                We&apos;ve sent a password reset link to <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500">
                                Click the link in the email to reset your password.
                            </p>
                            <button
                                onClick={() => { setMode('login'); setResetSent(false); clearForm(); }}
                                className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                <ArrowLeft size={16} />
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="text-indigo-600" size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Enter your email and we&apos;ll send you a reset link
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleForgotPassword}>
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email address
                                    </label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                {message && (
                                    <p className={`text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                        {message.text}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full py-3 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Send Reset Link'}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); clearForm(); }}
                                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        <ArrowLeft size={14} />
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── Sign Up View ──
    if (mode === 'signup') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Building2 className="text-white" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Start managing your properties for free
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSignUp}>
                        <div>
                            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="signup-name"
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="signup-phone"
                                    type="tel"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="+254 700 000 000"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    id="signup-email"
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {message && (
                            <p className={`text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                {message.text}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Create Account'}
                        </button>

                        <p className="text-xs text-center text-gray-500">
                            You&apos;ll start on the <strong>Free Plan</strong> (1 property, 5 units)
                        </p>
                    </form>

                    <div className="mt-6 text-center border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => { setMode('login'); clearForm(); }}
                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login View ──
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Building2 className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Sign in to your EstateFlow account
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="text-right">
                        <button
                            type="button"
                            onClick={() => { setMode('forgot'); clearForm(); }}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {message && (
                        <p className={`text-sm text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {message.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <button
                            onClick={() => { setMode('signup'); clearForm(); }}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Sign up as a Landlord
                        </button>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Tenants & guards are invited by their landlord
                    </p>
                </div>
            </div>
        </div>
    );
}
