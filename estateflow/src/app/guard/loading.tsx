import { Loader2 } from 'lucide-react';

export default function GuardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 bg-slate-800 rounded-lg w-48 mb-2" />
                    <div className="h-4 bg-slate-800 rounded w-64" />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            </div>
        </div>
    );
}
