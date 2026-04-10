import AdvocateSidebar from '@/components/advocate/Sidebar';
import AdvocateTopbar from '@/components/advocate/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';

export default function AdvocateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['advocate', 'lawyer']}>
      <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
        <AdvocateSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdvocateTopbar />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
