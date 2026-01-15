import { Building2, Users, DollarSign, AlertCircle } from 'lucide-react';

// Placeholder stats - will be dynamic later
const stats = [
    {
        label: 'Total Properties',
        value: '0',
        icon: Building2,
        color: 'bg-blue-500',
    },
    {
        label: 'Active Tenants',
        value: '0',
        icon: Users,
        color: 'bg-green-500',
    },
    {
        label: 'Revenue (This Month)',
        value: 'KES 0',
        icon: DollarSign,
        color: 'bg-purple-500',
    },
    {
        label: 'Pending Maintenance',
        value: '0',
        icon: AlertCircle,
        color: 'bg-amber-500',
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">Welcome back! Here&apos;s your property overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="text-white" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-600 text-sm">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        <p className="text-slate-500 text-center py-8">No recent activity yet.</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <a
                            href="/admin/properties"
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                        >
                            <Building2 className="text-indigo-600 mb-2" size={28} />
                            <span className="text-sm font-medium text-slate-700">Add Property</span>
                        </a>
                        <a
                            href="/admin/tenants"
                            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-green-50 rounded-lg border border-slate-200 hover:border-green-300 transition-colors"
                        >
                            <Users className="text-green-600 mb-2" size={28} />
                            <span className="text-sm font-medium text-slate-700">Add Tenant</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
