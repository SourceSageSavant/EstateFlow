'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function SuperadminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Superadmin Error Boundary]', error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-400" size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-slate-400 text-sm mb-6">
                    An unexpected error occurred in the admin panel. Check the console for details.
                </p>
                {error.digest && (
                    <p className="text-xs text-slate-600 mb-4 font-mono">
                        Error ID: {error.digest}
                    </p>
                )}
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-xl transition-colors"
                >
                    <RefreshCw size={16} />
                    Try Again
                </button>
            </div>
        </div>
    );
}
