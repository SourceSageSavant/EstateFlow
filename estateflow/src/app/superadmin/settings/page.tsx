'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Settings,
    Loader2,
    Save,
    Crown,
    User,
    Mail,
    Phone,
    Shield,
} from 'lucide-react';

export default function SuperadminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile({ ...data, email: user.email });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 mt-1">Manage your superadmin account</p>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Crown className="text-amber-500" size={20} />
                    Admin Profile
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <User className="text-slate-500" size={18} />
                        <div>
                            <p className="text-xs text-slate-500">Full Name</p>
                            <p className="text-white">{profile?.full_name || 'Not set'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <Mail className="text-slate-500" size={18} />
                        <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-white">{profile?.email || 'Not set'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <Phone className="text-slate-500" size={18} />
                        <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-white">{profile?.phone_number || 'Not set'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <Shield className="text-slate-500" size={18} />
                        <div>
                            <p className="text-xs text-slate-500">Role</p>
                            <p className="text-amber-400 font-medium uppercase text-sm">{profile?.role || 'superadmin'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Config */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="text-slate-400" size={20} />
                    Platform Configuration
                </h2>
                <p className="text-slate-500 text-sm">
                    Platform settings like branding, email templates, and default configurations will be available here in a future update.
                </p>
            </div>
        </div>
    );
}
