'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showBanner) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium transition-all ${isOnline
                    ? 'bg-green-600 text-white'
                    : 'bg-amber-500 text-amber-900'
                }`}
        >
            <div className="flex items-center justify-center gap-2">
                {isOnline ? (
                    <>
                        <Wifi size={16} />
                        <span>Back online</span>
                    </>
                ) : (
                    <>
                        <WifiOff size={16} />
                        <span>You're offline - some features may be limited</span>
                    </>
                )}
            </div>
        </div>
    );
}
