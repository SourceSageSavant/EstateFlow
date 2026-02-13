import SuperadminSidebar from '@/components/superadmin/Sidebar';

export default function SuperadminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 flex">
            <SuperadminSidebar />
            <main className="flex-1 pt-16 p-6 lg:pt-8 lg:p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
