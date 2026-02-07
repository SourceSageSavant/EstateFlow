'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#1e293b',
                    color: '#f8fafc',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                },
                success: {
                    iconTheme: {
                        primary: '#22c55e',
                        secondary: '#f8fafc',
                    },
                    style: {
                        background: '#166534',
                        color: '#f8fafc',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#f8fafc',
                    },
                    style: {
                        background: '#991b1b',
                        color: '#f8fafc',
                    },
                },
                loading: {
                    iconTheme: {
                        primary: '#6366f1',
                        secondary: '#f8fafc',
                    },
                },
            }}
        />
    );
}
