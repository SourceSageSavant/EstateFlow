'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Building2,
    Home,
    User,
    Calendar,
    DollarSign,
    FileText,
    Loader2,
    Check,
    Search
} from 'lucide-react';

export default function NewLeasePage() {
    const router = useRouter();
    const supabase = createClient();

    // Data Loading
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loadingProperties, setLoadingProperties] = useState(true);

    // Form State
    const [selectedProperty, setSelectedProperty] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [selectedTenant, setSelectedTenant] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rentAmount, setRentAmount] = useState('');
    const [securityDeposit, setSecurityDeposit] = useState('');
    const [terms, setTerms] = useState(`STANDARD LEASE AGREEMENT

1. PARTIES: This agreement is made between the Landlord and Tenant identified above.
2. PROPERTY: The Landlord agrees to rent the Unit identified above to the Tenant.
3. TERM: The lease term shall begin on the Start Date and end on the End Date.
4. RENT: The Tenant agrees to pay the Rent Amount on the due day of each month.
5. DEPOSIT: A Security Deposit is required prior to move-in.
6. USE: The property is for residential use only.
7. UTILITIES: Tenant is responsible for electricity and water unless otherwise stated.
8. RULES: Tenant agrees to abide by all building rules and regulations.

[Additional terms can be added here]`);

    const [creating, setCreating] = useState(false);

    // Load Properties
    useEffect(() => {
        const fetchProperties = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('properties')
                .select('id, name')
                .eq('landlord_id', user.id);

            setProperties(data || []);
            setLoadingProperties(false);
        };
        fetchProperties();
    }, []);

    // Load Units when Property changes
    useEffect(() => {
        if (!selectedProperty) {
            setUnits([]);
            return;
        }

        const fetchUnits = async () => {
            const { data } = await supabase
                .from('units')
                .select('id, unit_number, rent_amount, current_tenant_id')
                .eq('property_id', selectedProperty)
                .order('unit_number');

            setUnits(data || []);
        };
        fetchUnits();
    }, [selectedProperty]);

    // Pre-fill fields when Unit changes
    useEffect(() => {
        const unit = units.find(u => u.id === selectedUnit);
        if (unit) {
            setRentAmount(unit.rent_amount?.toString() || '');
            if (unit.current_tenant_id) {
                // Determine if we should auto-select based on requirement.
                // For now, let's auto-select the current tenant if exists
                // But we still need their details
                // fetchTenantDetails(unit.current_tenant_id);
            }
        }
    }, [selectedUnit, units]);

    // Search Tenants
    useEffect(() => {
        if (searchTerm.length < 2) return;

        const timeout = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone_number')
                .ilike('email', `%${searchTerm}%`)
                .eq('role', 'tenant')
                .limit(5);

            setTenants(data || []);
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTenant) {
            toast.error('Please select a tenant');
            return;
        }

        setCreating(true);

        try {
            const { error } = await (supabase
                .from('leases') as any)
                .insert({
                    unit_id: selectedUnit,
                    tenant_id: selectedTenant,
                    start_date: startDate,
                    end_date: endDate,
                    rent_amount: parseFloat(rentAmount),
                    security_deposit: parseFloat(securityDeposit) || 0,
                    terms_text: terms,
                    status: 'pending_signature'
                });

            if (error) throw error;

            toast.success('Lease created successfully');
            router.push('/admin/leases');
        } catch (error) {
            toast.error('Failed to create lease');
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link
                href="/admin/leases"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft size={20} />
                Back to Leases
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <h1 className="text-xl font-bold text-slate-900">Create New Lease Agreement</h1>
                    <p className="text-slate-500 text-sm">Draft a new lease for review and signature</p>
                </div>

                <form onSubmit={handleCreate} className="p-6 space-y-8">
                    {/* Unit Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={selectedProperty}
                                    onChange={(e) => {
                                        setSelectedProperty(e.target.value);
                                        setSelectedUnit('');
                                    }}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">Select Property</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                            <div className="relative">
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    required
                                    disabled={!selectedProperty}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    <option value="">Select Unit</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>Unit {u.unit_number} {u.current_tenant_id ? '(Occupied)' : '(Vacant)'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tenant Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tenant</label>
                        <div className="space-y-3">
                            {!selectedTenant ? (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {tenants.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                            {tenants.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTenant(t.id);
                                                        setSearchTerm(t.full_name || t.email);
                                                        setTenants([]);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="font-medium text-slate-900 group-hover:text-indigo-600 text-sm">{t.full_name}</p>
                                                        <p className="text-xs text-slate-500">{t.email}</p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 text-indigo-600 text-xs font-semibold">Select</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-200 rounded-full flex items-center justify-center">
                                            <User className="text-indigo-700" size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-indigo-900 text-sm">{searchTerm}</p>
                                            <p className="text-xs text-indigo-700">Selected Tenant</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTenant('');
                                            setSearchTerm('');
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lease Terms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Rent (KES)</label>
                            <input
                                type="number"
                                value={rentAmount}
                                onChange={(e) => setRentAmount(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Security Deposit (KES)</label>
                            <input
                                type="number"
                                value={securityDeposit}
                                onChange={(e) => setSecurityDeposit(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Lease Terms</label>
                        <textarea
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            rows={10}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={creating || !selectedUnit || !selectedTenant}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {creating ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                            Create Lease Agreement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
