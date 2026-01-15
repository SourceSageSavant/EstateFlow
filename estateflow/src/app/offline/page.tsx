'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <WifiOff className="text-slate-400" size={40} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
                <p className="text-slate-400 mb-8">
                    It looks like you've lost your internet connection. Some features may be limited.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleRefresh}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium"
                    >
                        <RefreshCw size={20} />
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                    >
                        <Home size={20} />
                        Go to Homepage
                    </Link>
                </div>

                <div className="mt-12 p-4 bg-slate-800 rounded-xl">
                    <p className="text-sm text-slate-400 mb-2">Available offline:</p>
                    <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Previously cached pages</li>
                        <li>• Guard verification (cached codes)</li>
                        <li>• Basic navigation</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
