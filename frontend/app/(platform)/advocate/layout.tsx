import AdvocateSidebar from '@/components/advocate/Sidebar';
import AdvocateTopbar from '@/components/advocate/Topbar';
import AuthGuard from '@/components/platform/AuthGuard';
import { TopbarProvider } from '@/components/platform/TopbarContext';

export default function AdvocateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['advocate', 'lawyer']}>
      <TopbarProvider>
        <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
          <AdvocateSidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <AdvocateTopbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 transition-spacing duration-300">
              <div className="max-w-[1600px] mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </TopbarProvider>
    </AuthGuard>
  );
}
