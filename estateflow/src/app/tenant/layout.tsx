'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    Key,
    CreditCard,
    Wrench,
    FileText,
    Phone,
    LogOut,
    Menu,
    X,
    Settings,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
    { href: '/tenant', label: 'Dashboard', icon: Home },
    { href: '/tenant/passes', label: 'Visitor Passes', icon: Key },
    { href: '/tenant/payments', label: 'Payments', icon: CreditCard },
    { href: '/tenant/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/tenant/lease', label: 'Lease Info', icon: FileText },
];

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar - matching Admin style */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-slate-700">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            EstateFlow
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Tenant Portal</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom section */}
                    <div className="p-4 border-t border-slate-700 space-y-1">
                        <Link
                            href="/tenant/contact"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <Phone size={20} />
                            <span>Contact Landlord</span>
                        </Link>
                        <Link
                            href="/tenant/settings"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
