'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after 30 seconds
            setTimeout(() => setShowPrompt(true), 30000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        setShowPrompt(false);
    };

    if (!showPrompt || isInstalled) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl z-50 animate-slide-up">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
            >
                <X size={18} />
            </button>
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="text-white" size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white">Install EstateFlow</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Get quick access and work offline
                    </p>
                    <button
                        onClick={handleInstall}
                        className="mt-3 w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors font-medium"
                    >
                        Install App
                    </button>
                </div>
            </div>
        </div>
    );
}
