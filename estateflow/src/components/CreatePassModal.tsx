'use client';

import { useState } from 'react';
import {
    X,
    User,
    Phone,
    Car,
    FileText,
    Calendar,
    Loader2,
    Send,
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CreatePassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPassCreated: (pass: any) => void;
    propertyId: string;
    unitId?: string;
}

export default function CreatePassModal({
    isOpen,
    onClose,
    onPassCreated,
    propertyId,
    unitId,
}: CreatePassModalProps) {
    const [visitorName, setVisitorName] = useState('');
    const [visitorPhone, setVisitorPhone] = useState('');
    const [visitorIdNumber, setVisitorIdNumber] = useState('');
    const [visitorVehicle, setVisitorVehicle] = useState('');
    const [purpose, setPurpose] = useState('');
    const [validHours, setValidHours] = useState(4); // Default 4 hours
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!visitorName.trim()) {
            toast.error('Visitor name is required');
            return;
        }

        setLoading(true);

        try {
            const validUntil = new Date();
            validUntil.setHours(validUntil.getHours() + validHours);

            const response = await fetch('/api/passes/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitorName,
                    visitorPhone: visitorPhone || null,
                    visitorIdNumber: visitorIdNumber || null,
                    visitorVehicle: visitorVehicle || null,
                    purpose: purpose || null,
                    propertyId,
                    unitId,
                    validFrom: new Date().toISOString(),
                    validUntil: validUntil.toISOString(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Failed to create pass');
                return;
            }

            toast.success('Gate pass created!');
            onPassCreated(data.pass);

            // Reset form
            setVisitorName('');
            setVisitorPhone('');
            setVisitorIdNumber('');
            setVisitorVehicle('');
            setPurpose('');
            setValidHours(4);

        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">Create Gate Pass</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Visitor Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Visitor Name *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={visitorName}
                                onChange={(e) => setVisitorName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone <span className="text-slate-400">(optional)</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="tel"
                                value={visitorPhone}
                                onChange={(e) => setVisitorPhone(e.target.value)}
                                placeholder="+254 7XX XXX XXX"
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* ID Number */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            ID Number <span className="text-slate-400">(optional)</span>
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={visitorIdNumber}
                                onChange={(e) => setVisitorIdNumber(e.target.value)}
                                placeholder="12345678"
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Vehicle */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Vehicle <span className="text-slate-400">(optional)</span>
                        </label>
                        <div className="relative">
                            <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={visitorVehicle}
                                onChange={(e) => setVisitorVehicle(e.target.value)}
                                placeholder="KCB 123X - White Toyota"
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Purpose of Visit <span className="text-slate-400">(optional)</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                            <textarea
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Guest visit, Delivery, etc."
                                rows={2}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Valid Duration */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Pass Valid For
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={validHours}
                                onChange={(e) => setValidHours(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white"
                            >
                                <option value={1}>1 hour</option>
                                <option value={2}>2 hours</option>
                                <option value={4}>4 hours</option>
                                <option value={8}>8 hours</option>
                                <option value={12}>12 hours</option>
                                <option value={24}>24 hours (1 day)</option>
                                <option value={48}>48 hours (2 days)</option>
                                <option value={168}>1 week</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Create Gate Pass
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
