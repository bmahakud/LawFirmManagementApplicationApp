import SuperAdminSidebar from '@/components/super-admin/Sidebar';
import SuperAdminTopbar from '@/components/super-admin/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';
import { TopbarProvider } from '@/components/platform/TopbarContext';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['super_admin', 'firm_owner']}>
      <TopbarProvider>
        <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
          <SuperAdminSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <SuperAdminTopbar />
            <main className="flex-1 overflow-y-auto p-8">{children}</main>
          </div>
        </div>
      </TopbarProvider>
    </AuthGuard>
  );
}
