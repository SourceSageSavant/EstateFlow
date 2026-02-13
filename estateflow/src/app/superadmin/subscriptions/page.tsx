'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Loader2,
    CreditCard,
    Check,
    Crown,
    Zap,
    Building2,
    Users,
    Shield,
    Edit3,
    Trash2,
} from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    billing_period: string;
    max_properties: number;
    max_units_per_property: number;
    max_guards: number;
    features: string[];
    is_active: boolean;
    subscriber_count?: number;
}

export default function SubscriptionsPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true });

            if (data) {
                // Get subscriber count for each plan
                const enriched = await Promise.all(
                    data.map(async (plan: any) => {
                        let subscriberCount = 0;
                        try {
                            const { count } = await supabase
                                .from('subscriptions')
                                .select('*', { count: 'exact', head: true })
                                .eq('plan_id', plan.id)
                                .eq('status', 'active');
                            subscriberCount = count || 0;
                        } catch {
                            // table might not exist
                        }

                        return {
                            ...plan,
                            features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || [],
                            subscriber_count: subscriberCount,
                        };
                    })
                );
                setPlans(enriched);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPlanIcon = (name: string) => {
        switch (name.toLowerCase()) {
            case 'free': return <Users className="text-slate-400" size={24} />;
            case 'starter': return <Zap className="text-blue-400" size={24} />;
            case 'professional': return <Crown className="text-purple-400" size={24} />;
            case 'enterprise': return <Shield className="text-amber-400" size={24} />;
            default: return <CreditCard className="text-slate-400" size={24} />;
        }
    };

    const getPlanGradient = (name: string) => {
        switch (name.toLowerCase()) {
            case 'free': return 'from-slate-600 to-slate-700';
            case 'starter': return 'from-blue-600 to-blue-700';
            case 'professional': return 'from-purple-600 to-purple-700';
            case 'enterprise': return 'from-amber-600 to-orange-600';
            default: return 'from-slate-600 to-slate-700';
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Subscription Plans</h1>
                    <p className="text-slate-400 mt-1">Manage pricing tiers and features</p>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors"
                    >
                        {/* Header */}
                        <div className={`bg-gradient-to-r ${getPlanGradient(plan.name)} p-6`}>
                            <div className="flex items-center justify-between mb-3">
                                {getPlanIcon(plan.name)}
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                                    {plan.subscriber_count} {plan.subscriber_count === 1 ? 'subscriber' : 'subscribers'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <p className="text-white/70 text-sm mt-1">{plan.description}</p>
                        </div>

                        {/* Pricing */}
                        <div className="p-6 border-b border-slate-800">
                            <div className="flex items-end gap-1">
                                <span className="text-3xl font-bold text-white">
                                    {plan.price === 0 ? 'Free' : `KES ${plan.price.toLocaleString()}`}
                                </span>
                                {plan.price > 0 && (
                                    <span className="text-slate-400 text-sm mb-1">/{plan.billing_period}</span>
                                )}
                            </div>
                        </div>

                        {/* Limits */}
                        <div className="p-6 border-b border-slate-800 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Building2 size={14} /> Properties
                                </span>
                                <span className="text-white font-medium">
                                    {plan.max_properties >= 999 ? 'Unlimited' : plan.max_properties}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Users size={14} /> Units / Property
                                </span>
                                <span className="text-white font-medium">
                                    {plan.max_units_per_property >= 999 ? 'Unlimited' : plan.max_units_per_property}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Shield size={14} /> Guards
                                </span>
                                <span className="text-white font-medium">
                                    {plan.max_guards >= 999 ? 'Unlimited' : plan.max_guards}
                                </span>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="p-6">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Features</p>
                            <ul className="space-y-2">
                                {plan.features.map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <Check className="text-green-500 shrink-0 mt-0.5" size={14} />
                                        <span className="text-slate-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {plans.length === 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
                    <CreditCard className="text-slate-600 mx-auto mb-4" size={48} />
                    <p className="text-slate-400 text-lg">No subscription plans found.</p>
                    <p className="text-slate-600 text-sm mt-1">Run the migration SQL to seed default plans.</p>
                </div>
            )}
        </div>
    );
}
