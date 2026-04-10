import PartnerManagerSidebar from '@/components/partner-manager/Sidebar';
import PartnerManagerTopbar from '@/components/partner-manager/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';

export default function PartnerManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['partner_manager']}>
      <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
        <PartnerManagerSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PartnerManagerTopbar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
