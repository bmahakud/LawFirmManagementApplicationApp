import SuperAdminSidebar from '@/components/super-admin/Sidebar';
import SuperAdminTopbar from '@/components/super-admin/Topbar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SuperAdminTopbar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
