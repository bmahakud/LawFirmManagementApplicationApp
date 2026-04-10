import PlatformOwnerSidebar from '@/components/platform-owner/Sidebar';
import PlatformOwnerTopbar from '@/components/platform-owner/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';

export default function PlatformOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['platform_owner']}>
      <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
        <PlatformOwnerSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PlatformOwnerTopbar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
