import ClientSidebar from '@/components/client/Sidebar';
import ClientTopbar from '@/components/client/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['client']}>
      <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
        <ClientSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ClientTopbar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
