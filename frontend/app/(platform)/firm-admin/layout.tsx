import FirmAdminSidebar from '@/components/firm-admin/Sidebar';
import FirmAdminTopbar from '@/components/firm-admin/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';

export default function FirmAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin', 'firm_admin']}>
      <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
        <FirmAdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <FirmAdminTopbar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
