'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import nextDynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const SignatureCanvas = nextDynamic(() => import('react-signature-canvas'), { ssr: false }) as any;
import {
    FileText,
    PenTool,
    Download,
    CheckCircle,
    Loader2,
    RotateCcw,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function TenantLeasePage() {
    const supabase = createClient();
    const sigCanvas = useRef<any>(null);

    const [lease, setLease] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [signMode, setSignMode] = useState(false);

    useEffect(() => {
        fetchLease();
    }, []);

    const fetchLease = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch latest lease
        const { data, error } = await supabase
            .from('leases')
            .select(`
                *,
                units (
                    unit_number,
                    properties (
                        name,
                        address
                    )
                ),
                profiles (
                    full_name
                )
            `)
            .eq('tenant_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching lease:', error);
        } else {
            setLease(data);
        }
        setLoading(false);
    };

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const handleSignAndSave = async () => {
        if (sigCanvas.current?.isEmpty()) {
            toast.error('Please sign the document before saving');
            return;
        }

        setSigning(true);
        const toastId = toast.loading('Generating and saving lease...');

        try {
            // 1. Generate PDF
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPos = 20;

            // Title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('RESIDENTIAL LEASE AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // Property Info
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Property: ${lease.units.properties.name}`, margin, yPos);
            yPos += 7;
            doc.text(`Address: ${lease.units.properties.address}`, margin, yPos);
            yPos += 7;
            doc.text(`Unit: ${lease.units.unit_number}`, margin, yPos);
            yPos += 15;

            // Tenant Info
            doc.text(`Tenant: ${lease.profiles.full_name}`, margin, yPos);
            yPos += 15;

            // Terms
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('TERMS AND CONDITIONS', margin, yPos);
            yPos += 10;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');

            const termsLines = doc.splitTextToSize(lease.terms_text || '', contentWidth);

            // Check page break for terms
            if (yPos + (termsLines.length * 5) > 250) {
                // Simplified page handling for brevity
                doc.text(termsLines, margin, yPos);
                doc.addPage();
                yPos = 20;
            } else {
                doc.text(termsLines, margin, yPos);
                yPos += (termsLines.length * 5) + 20;
            }

            // Dates & Rent (Summary)
            doc.setFont('helvetica', 'bold');
            doc.text(`Start Date: ${format(new Date(lease.start_date), 'MMMM d, yyyy')}`, margin, yPos);
            yPos += 7;
            doc.text(`End Date: ${format(new Date(lease.end_date), 'MMMM d, yyyy')}`, margin, yPos);
            yPos += 7;
            doc.text(`Monthly Rent: KES ${lease.rent_amount.toLocaleString()}`, margin, yPos);
            yPos += 20;

            // Signature
            doc.text('Signed by Tenant:', margin, yPos);
            yPos += 10;

            const signatureUnscaled = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            doc.addImage(signatureUnscaled, 'PNG', margin, yPos, 60, 30);

            doc.setFontSize(9);
            doc.text(`Digitally signed on ${format(new Date(), 'PPpp')}`, margin, yPos + 35);

            // 2. Upload to Supabase Storage
            const pdfBlob = doc.output('blob');
            const fileName = `lease_${lease.id}_${Date.now()}.pdf`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('leases')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('leases')
                .getPublicUrl(fileName);

            // 3. Update Database
            const { error: dbError } = await (supabase
                .from('leases') as any)
                .update({
                    status: 'active',
                    is_signed: true,
                    signed_at: new Date().toISOString(),
                    pdf_url: publicUrlData.publicUrl
                })
                .eq('id', lease.id);

            if (dbError) throw dbError;

            toast.success('Lease signed and saved!', { id: toastId });
            setSignMode(false);
            fetchLease(); // Refresh

        } catch (error: any) {
            console.error('Error signing lease:', error);
            toast.error(error.message || 'Failed to save signed lease', { id: toastId });
        } finally {
            setSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="text-center py-12">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-slate-400" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">No Lease Agreement Found</h2>
                <p className="text-slate-500 mt-2">You don't have any active or pending lease agreements.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Lease Agreement</h1>
                <p className="text-slate-500">View and sign your digital lease</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header / Status */}
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{lease.units.properties.name} - Unit {lease.units.unit_number}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                ${lease.status === 'active' ? 'bg-green-100 text-green-700' :
                                    lease.status === 'pending_signature' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                                {lease.status.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-slate-500">
                                {format(new Date(lease.start_date), 'MMM d, yyyy')} - {format(new Date(lease.end_date), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                    <div>
                        {lease.status === 'active' && lease.pdf_url && (
                            <button
                                onClick={() => window.open(lease.pdf_url, '_blank')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                            >
                                <Download size={18} />
                                Download PDF
                            </button>
                        )}
                        {lease.status === 'pending_signature' && !signMode && (
                            <button
                                onClick={() => setSignMode(true)}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm animate-pulse"
                            >
                                <PenTool size={18} />
                                Sign Lease
                            </button>
                        )}
                    </div>
                </div>

                {/* Lease Content */}
                <div className="p-8 sm:p-12 bg-white">
                    {/* Only show Preview text if not signing, or show simplified text while signing */}

                    <div className="prose max-w-none mb-8">
                        <h3>TERMS AND CONDITIONS</h3>
                        <div className="whitespace-pre-line text-slate-700 font-serif leading-relaxed">
                            {lease.terms_text}
                        </div>
                    </div>

                    {/* Rent Summary */}
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
                        <h4 className="font-semibold text-slate-900 mb-4">Financial Summary</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Monthly Rent</p>
                                <p className="text-lg font-bold text-slate-900">KES {lease.rent_amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Security Deposit</p>
                                <p className="text-lg font-bold text-slate-900">KES {lease.security_deposit?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Signature Section */}
                    {signMode && (
                        <div className="mt-8 border-t-2 border-dashed border-slate-200 pt-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <PenTool className="text-indigo-600" />
                                Electronic Signature
                            </h3>

                            <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-2 inline-block">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    canvasProps={{
                                        width: 500,
                                        height: 200,
                                        className: 'sigCanvas bg-white rounded cursor-crosshair max-w-full'
                                    }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Sign above using your mouse or finger</p>

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={handleSignAndSave}
                                    disabled={signing}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    {signing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                    Sign & Complete
                                </button>
                                <button
                                    onClick={clearSignature}
                                    disabled={signing}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <RotateCcw size={18} />
                                    Clear
                                </button>
                                <button
                                    onClick={() => setSignMode(false)}
                                    disabled={signing}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {lease.status === 'active' && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-lg border border-green-100">
                                <CheckCircle size={24} />
                                <div>
                                    <p className="font-bold">Lease Signed and Active</p>
                                    <p className="text-sm">Signed on {format(new Date(lease.signed_at || lease.updated_at || lease.created_at || new Date()), 'PPP')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
