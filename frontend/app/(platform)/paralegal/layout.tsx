import ParalegalSidebar from '@/components/paralegal/Sidebar';
import ParalegalTopbar from '@/components/paralegal/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';

export default function ParalegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['paralegal']}>
      <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
        <ParalegalSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ParalegalTopbar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
