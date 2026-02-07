'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

// Loading fallback component
function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto" />
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>
    );
}

// Main component that uses useSearchParams
function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        // Handle the code exchange from email link
        const handleCodeExchange = async () => {
            // First check if we already have a session (e.g. from auth/callback exchange)
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setSessionReady(true);
                setLoading(false);
                return;
            }

            // Check for code in URL (direct access or error cases)
            const code = searchParams.get('code');
            const errorDescription = searchParams.get('error_description');

            if (errorDescription) {
                setMessage(errorDescription.replace(/\+/g, ' '));
                setLoading(false);
                return;
            }

            if (code) {
                try {
                    // Exchange the code for a session
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        console.error('Code exchange error:', error);
                        setMessage(error.message || 'Invalid or expired reset link.');
                        setLoading(false);
                        return;
                    }

                    setSessionReady(true);
                    setLoading(false);
                } catch (err) {
                    console.error('Exchange error:', err);
                    setMessage('Failed to verify reset link. Please try again.');
                    setLoading(false);
                }
            } else {
                // Check URL hash for token (Supabase sometimes uses hash)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');

                if (accessToken) {
                    // Set session from hash
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: hashParams.get('refresh_token') || '',
                    });

                    if (!error) {
                        setSessionReady(true);
                    } else {
                        setMessage('Invalid or expired reset link. Please request a new one.');
                    }
                } else {
                    setMessage('Invalid or expired reset link. Please request a new one.');
                }
                setLoading(false);
            }
        };

        handleCodeExchange();
    }, [searchParams]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setMessage(error.message);
            } else {
                setSuccess(true);
                // Sign out and redirect to login after 3 seconds
                await supabase.auth.signOut();
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (error) {
            setMessage('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto" />
                    <p className="text-gray-600">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-lg">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
                    <p className="text-gray-600">
                        Your password has been successfully changed. Redirecting to login...
                    </p>
                    <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mx-auto" />
                </div>
            </div>
        );
    }

    // Error state - no valid session
    if (!sessionReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-lg">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Link Expired</h2>
                    <p className="text-gray-600">{message || 'Invalid or expired reset link. Please request a new one.'}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // Reset form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-indigo-600" size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {message && (
                        <div className="text-sm text-center text-red-500">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !password || !confirmPassword}
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Export with Suspense wrapper (required for useSearchParams)
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
