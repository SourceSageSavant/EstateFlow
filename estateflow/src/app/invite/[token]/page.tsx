'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2,
    Building,
    Home,
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Shield,
    Users,
} from 'lucide-react';

interface InvitationData {
    email: string;
    role: 'tenant' | 'guard';
    fullName?: string;
    phoneNumber?: string;
    property: { id: string; name: string } | null;
    unit: { id: string; unit_number: string; rent_amount: number } | null;
}

function InvitePageContent() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form fields
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const res = await fetch(`/api/invitations/accept?token=${token}`);
            const data = await res.json();

            if (!res.ok || !data.valid) {
                setError(data.error || 'Invalid invitation');
                setLoading(false);
                return;
            }

            setInvitation(data.invitation);
            setFullName(data.invitation.fullName || '');
            setPhoneNumber(data.invitation.phoneNumber || '');
            setLoading(false);
        } catch (err) {
            setError('Failed to validate invitation');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!fullName.trim()) {
            setFormError('Please enter your full name');
            return;
        }

        if (password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password,
                    fullName: fullName.trim(),
                    phoneNumber: phoneNumber.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || 'Failed to create account');
                setSubmitting(false);
                return;
            }

            setSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setFormError('An unexpected error occurred');
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin h-10 w-10 text-indigo-600 mx-auto" />
                    <p className="text-gray-600">Validating invitation...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
                <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="text-red-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Invalid Invitation</h1>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
                <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Account Created!</h1>
                    <p className="text-gray-600">
                        Your account has been created successfully. Redirecting to login...
                    </p>
                    <Loader2 className="animate-spin h-6 w-6 text-indigo-600 mx-auto" />
                </div>
            </div>
        );
    }

    // Invitation form
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome to EstateFlow</h1>
                    <p className="text-gray-600 mt-2">Complete your profile to get started</p>
                </div>

                {/* Invitation Details Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${invitation?.role === 'tenant'
                                ? 'bg-blue-100'
                                : 'bg-green-100'
                            }`}>
                            {invitation?.role === 'tenant' ? (
                                <Users className="text-blue-600" size={24} />
                            ) : (
                                <Shield className="text-green-600" size={24} />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">You're joining as a</p>
                            <p className="text-lg font-semibold text-gray-900 capitalize">
                                {invitation?.role}
                            </p>
                        </div>
                    </div>

                    {invitation?.property && (
                        <div className="flex items-center gap-3 text-gray-600 mb-2">
                            <Building size={18} />
                            <span>{invitation.property.name}</span>
                        </div>
                    )}

                    {invitation?.unit && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <Home size={18} />
                            <span>
                                Unit {invitation.unit.unit_number}
                                {invitation.unit.rent_amount && (
                                    <span className="text-gray-400 ml-2">
                                        (KES {invitation.unit.rent_amount.toLocaleString()}/mo)
                                    </span>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {/* Registration Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Your Account</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email (readonly) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={invitation?.email || ''}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                                />
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+254 7XX XXX XXX"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Create Password *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {formError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {formError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{' '}
                    <a href="/login" className="text-indigo-600 hover:underline font-medium">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}

// Wrap in Suspense for useParams
export default function InvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
            </div>
        }>
            <InvitePageContent />
        </Suspense>
    );
}
