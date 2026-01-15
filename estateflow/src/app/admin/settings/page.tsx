'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Settings,
    User,
    Building,
    Bell,
    Shield,
    CreditCard,
    Save,
    Loader2,
    Check,
    Mail,
    Phone,
} from 'lucide-react';

export default function SettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Form states
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [notifySms, setNotifySms] = useState(false);
    const [notifyMaintenance, setNotifyMaintenance] = useState(true);
    const [notifyPayments, setNotifyPayments] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setProfile(data);
            setFullName(data.full_name || '');
            setPhone(data.phone || '');
        }

        setLoading(false);
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);

        await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone: phone,
            })
            .eq('id', profile.id);

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'billing', label: 'Billing', icon: CreditCard },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-600 mt-1">Manage your account preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <nav className="divide-y divide-slate-100">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === tab.id
                                            ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Profile Information</h2>
                                    <p className="text-sm text-slate-500">Update your personal details</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <User className="text-indigo-600" size={32} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{fullName || 'Your Name'}</p>
                                        <p className="text-sm text-slate-500">{profile?.email}</p>
                                        <button className="mt-1 text-sm text-indigo-600 font-medium">Change Photo</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={profile?.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+254..."
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                                        <input
                                            type="text"
                                            value={profile?.role || 'landlord'}
                                            disabled
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 capitalize"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : saved ? (
                                        <Check size={20} />
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    {saved ? 'Saved!' : 'Save Changes'}
                                </button>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Notifications</h2>
                                    <p className="text-sm text-slate-500">Choose how you want to be notified</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Mail className="text-slate-400" size={20} />
                                            <div>
                                                <p className="font-medium text-slate-900">Email Notifications</p>
                                                <p className="text-sm text-slate-500">Receive updates via email</p>
                                            </div>
                                        </div>
                                        <Toggle checked={notifyEmail} onChange={setNotifyEmail} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Phone className="text-slate-400" size={20} />
                                            <div>
                                                <p className="font-medium text-slate-900">SMS Notifications</p>
                                                <p className="text-sm text-slate-500">Receive updates via SMS</p>
                                            </div>
                                        </div>
                                        <Toggle checked={notifySms} onChange={setNotifySms} />
                                    </div>

                                    <hr className="border-slate-200" />

                                    <p className="text-sm font-medium text-slate-700">Notification Types</p>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-slate-900">Maintenance Requests</p>
                                            <p className="text-sm text-slate-500">New requests from tenants</p>
                                        </div>
                                        <Toggle checked={notifyMaintenance} onChange={setNotifyMaintenance} />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-slate-900">Payment Updates</p>
                                            <p className="text-sm text-slate-500">Rent payments and receipts</p>
                                        </div>
                                        <Toggle checked={notifyPayments} onChange={setNotifyPayments} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Security</h2>
                                    <p className="text-sm text-slate-500">Manage your account security</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 border border-slate-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-900">Password</p>
                                                <p className="text-sm text-slate-500">Last changed: Never</p>
                                            </div>
                                            <button className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium hover:bg-indigo-100">
                                                Change Password
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-slate-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                                                <p className="text-sm text-slate-500">Add an extra layer of security</p>
                                            </div>
                                            <button className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium hover:bg-indigo-100">
                                                Enable
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-red-900">Delete Account</p>
                                                <p className="text-sm text-red-600">Permanently delete your account</p>
                                            </div>
                                            <button className="px-4 py-2 text-red-600 bg-white border border-red-200 rounded-lg font-medium hover:bg-red-100">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Billing Tab */}
                        {activeTab === 'billing' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Billing</h2>
                                    <p className="text-sm text-slate-500">Manage your subscription and payment methods</p>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
                                    <p className="text-indigo-100 text-sm mb-1">Current Plan</p>
                                    <p className="text-2xl font-bold mb-4">Free Trial</p>
                                    <p className="text-indigo-100 text-sm">Unlimited properties • Unlimited tenants • All features</p>
                                </div>

                                <div className="p-4 border border-slate-200 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">Payment Method</p>
                                            <p className="text-sm text-slate-500">No payment method added</p>
                                        </div>
                                        <button className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium hover:bg-indigo-100">
                                            Add Method
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 border border-slate-200 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">Billing History</p>
                                            <p className="text-sm text-slate-500">View past invoices</p>
                                        </div>
                                        <button className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg font-medium hover:bg-indigo-100">
                                            View All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
        >
            <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'
                    }`}
            />
        </button>
    );
}
