'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import {
    X,
    Mail,
    User,
    Phone,
    Building,
    Home,
    Loader2,
    Send,
    CheckCircle,
    Copy,
    ExternalLink,
    MessageCircle,
} from 'lucide-react';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInviteSent: () => void;
    role: 'tenant' | 'guard';
    properties: Array<{ id: string; name: string }>;
    units?: Array<{ id: string; unit_number: string; property_id: string; rent_amount?: number }>;
}

export default function InviteModal({
    isOpen,
    onClose,
    onInviteSent,
    role,
    properties,
    units = [],
}: InviteModalProps) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const supabase = createClient();

    // Filter units by selected property
    const availableUnits = units.filter(u => u.property_id === selectedProperty);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setFullName('');
            setPhoneNumber('');
            setSelectedProperty(properties[0]?.id || '');
            setSelectedUnit('');
            setError(null);
            setSuccess(false);
            setInviteLink(null);
        }
    }, [isOpen, properties]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/api/invitations/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    role,
                    propertyId: selectedProperty,
                    unitId: role === 'tenant' ? selectedUnit : null,
                    fullName: fullName || null,
                    phoneNumber: phoneNumber || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to send invitation');
                setLoading(false);
                return;
            }

            setSuccess(true);

            // If manual share required, show the link
            if (data.manualShare && data.invitation?.inviteUrl) {
                setInviteLink(data.invitation.inviteUrl);
            }

            setLoading(false);
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    const copyLink = async () => {
        if (inviteLink) {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        if (success) {
            onInviteSent();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Invite ${role === 'tenant' ? 'Tenant' : 'Guard'}`}
            maxWidth="max-w-md"
        >
            {success ? (
                // Success state
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Invitation Sent!</h3>
                    <p className="text-slate-600">
                        An invitation has been created for <strong>{email}</strong>
                    </p>

                    {inviteLink && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl text-left space-y-3">
                            <p className="text-sm text-slate-600">
                                Share this link with the invitee:
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 truncate"
                                />
                                <button
                                    onClick={copyLink}
                                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    title="Copy link"
                                >
                                    {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                </button>
                                <a
                                    href={`https://wa.me/${phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(`You've been invited to EstateFlow! Click this link to set up your account: ${inviteLink}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    title="Share via WhatsApp"
                                >
                                    <MessageCircle size={18} />
                                </a>
                                <a
                                    href={inviteLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                                    title="Open link"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                            {copied && (
                                <p className="text-sm text-green-600">Link copied!</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleClose}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                    >
                        Done
                    </button>
                </div>
            ) : (
                // Form
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Notice for phone-only */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
                        <p><strong>Tip:</strong> Email is optional. For users without email, enter their phone number and share the invite link via WhatsApp.</p>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address <span className="text-slate-400">(optional)</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tenant@example.com (leave blank if no email)"
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Full Name (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name <span className="text-slate-400">(optional)</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Phone (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone <span className="text-slate-400">(optional)</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+254 7XX XXX XXX"
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Property */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Property *
                        </label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={selectedProperty}
                                onChange={(e) => {
                                    setSelectedProperty(e.target.value);
                                    setSelectedUnit('');
                                }}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white text-slate-900"
                            >
                                <option value="">Select a property...</option>
                                {properties.map((prop) => (
                                    <option key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Unit (only for tenants) */}
                    {role === 'tenant' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Unit *
                            </label>
                            <div className="relative">
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    required
                                    disabled={!selectedProperty || availableUnits.length === 0}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white disabled:bg-slate-100 text-slate-900"
                                >
                                    <option value="">
                                        {!selectedProperty
                                            ? 'Select a property first...'
                                            : availableUnits.length === 0
                                                ? 'No available units'
                                                : 'Select a unit...'}
                                    </option>
                                    {availableUnits.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            Unit {unit.unit_number}
                                            {unit.rent_amount && ` (KES ${unit.rent_amount.toLocaleString()}/mo)`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedProperty && availableUnits.length === 0 && (
                                <p className="mt-1 text-sm text-amber-600">
                                    All units in this property are occupied.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || (role === 'tenant' && availableUnits.length === 0)}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Send Invitation
                            </>
                        )}
                    </button>
                </form>
            )}
        </Modal>
    );
}
