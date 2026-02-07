'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="text-red-600" size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Authentication Error</h2>
                    <p className="mt-2 text-gray-600">
                        There was a problem verifying your identity. The link may have expired or is invalid.
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                    Back to Login
                </Link>
            </div>
        </div>
    );
}
