'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Smartphone,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    unitId: string;
    amount: number;
    paymentPeriod: string;
    tenantPhone?: string;
}

export default function PaymentModal({
    isOpen,
    onClose,
    propertyId,
    unitId,
    amount,
    paymentPeriod,
    tenantPhone = '',
}: PaymentModalProps) {
    const [phoneNumber, setPhoneNumber] = useState(tenantPhone);
    const [status, setStatus] = useState<'idle' | 'processing' | 'checking' | 'success' | 'failed'>('idle');
    const [message, setMessage] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');

    useEffect(() => {
        if (tenantPhone) {
            setPhoneNumber(tenantPhone);
        }
    }, [tenantPhone]);

    useEffect(() => {
        // Reset state when modal opens
        if (isOpen) {
            setStatus('idle');
            setMessage('');
            setTransactionId('');
            setReceiptNumber('');
        }
    }, [isOpen]);

    // Poll for transaction status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (status === 'checking' && transactionId) {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/mpesa/callback?transactionId=${transactionId}`);
                    const data = await response.json();

                    if (data.status === 'completed') {
                        setStatus('success');
                        setReceiptNumber(data.receiptNumber);
                        setMessage('Payment received successfully!');
                        clearInterval(interval);
                    } else if (data.status === 'failed') {
                        setStatus('failed');
                        setMessage(data.message || 'Payment was not completed');
                        clearInterval(interval);
                    }
                } catch (error) {
                    // Continue polling
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, transactionId]);

    const handlePay = async () => {
        if (!phoneNumber) {
            setMessage('Please enter your phone number');
            return;
        }

        setStatus('processing');
        setMessage('Sending payment request to your phone...');

        try {
            const response = await fetch('/api/mpesa/stkpush', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    unitId,
                    amount,
                    phoneNumber,
                    paymentType: 'rent',
                    paymentPeriod,
                    description: `Rent payment for ${paymentPeriod}`,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setTransactionId(data.transactionId);
                setStatus('checking');
                setMessage(data.message || 'Check your phone and enter your M-Pesa PIN');
            } else {
                setStatus('failed');
                setMessage(data.error || 'Failed to initiate payment');
            }
        } catch (error: any) {
            setStatus('failed');
            setMessage(error.message || 'Network error. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={status === 'idle' || status === 'failed' ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
                {/* Close button */}
                {(status === 'idle' || status === 'failed' || status === 'success') && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                )}

                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Pay with M-Pesa</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {paymentPeriod ? `Rent for ${paymentPeriod}` : 'Complete your payment'}
                    </p>
                </div>

                {/* Amount */}
                <div className="text-center py-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-700 mb-1">Amount to Pay</p>
                    <p className="text-3xl font-bold text-green-800">
                        KSh {amount.toLocaleString()}
                    </p>
                </div>

                {/* Status Display */}
                {status === 'processing' && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                        <Loader2 className="animate-spin text-blue-500" size={24} />
                        <p className="text-blue-800">{message}</p>
                    </div>
                )}

                {status === 'checking' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                            <Loader2 className="animate-spin text-amber-500" size={24} />
                            <div>
                                <p className="font-medium text-amber-800">{message}</p>
                                <p className="text-sm text-amber-600">Waiting for confirmation...</p>
                            </div>
                        </div>
                        <p className="text-xs text-center text-slate-500">
                            Do not close this page until payment is confirmed
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                            <CheckCircle className="text-green-500" size={24} />
                            <div className="text-left">
                                <p className="font-medium text-green-800">{message}</p>
                                {receiptNumber && (
                                    <p className="text-sm text-green-600">Receipt: {receiptNumber}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                        >
                            Done
                        </button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                            <XCircle className="text-red-500 flex-shrink-0" size={24} />
                            <p className="text-red-800">{message}</p>
                        </div>
                        <button
                            onClick={() => setStatus('idle')}
                            className="w-full py-3 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Phone Input (only when idle) */}
                {status === 'idle' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                M-Pesa Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="0722 123 456"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white text-slate-900 text-lg"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                You'll receive an STK push prompt on this number
                            </p>
                        </div>

                        <button
                            onClick={handlePay}
                            disabled={!phoneNumber}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                        >
                            <Smartphone size={20} />
                            Pay Now
                        </button>

                        <p className="text-xs text-center text-slate-400">
                            Secured by Safaricom M-Pesa
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
