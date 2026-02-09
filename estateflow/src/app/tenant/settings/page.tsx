'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    User,
    Bell,
    Lock,
    Save,
    Loader2,
    Check,
} from 'lucide-react';

export default function TenantSettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            setProfile(data);
            setFullName(data.full_name || '');
            setPhone(data.phone_number || '');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('profiles').update({
            full_name: fullName,
            phone_number: phone,
        }).eq('id', user.id);

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

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-600 mt-1">Manage your account preferences</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <User className="text-indigo-600" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-900">Profile Information</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                        />
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Bell className="text-amber-600" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div>
                            <p className="font-medium text-slate-900">Email Notifications</p>
                            <p className="text-sm text-slate-500">Receive updates via email</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer">
                        <div>
                            <p className="font-medium text-slate-900">SMS Notifications</p>
                            <p className="text-sm text-slate-500">Receive updates via SMS</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={smsNotifications}
                            onChange={(e) => setSmsNotifications(e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                    </label>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Lock className="text-red-600" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-900">Security</h3>
                </div>

                <button
                    onClick={() => alert('Password reset email sent!')}
                    className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
                >
                    Change Password
                </button>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {saving ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : saved ? (
                    <>
                        <Check size={20} />
                        Saved!
                    </>
                ) : (
                    <>
                        <Save size={20} />
                        Save Changes
                    </>
                )}
            </button>
        </div>
    );
}
