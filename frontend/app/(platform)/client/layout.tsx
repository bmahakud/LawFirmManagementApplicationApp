import ClientSidebar from '@/components/client/Sidebar';
import ClientTopbar from '@/components/client/Topbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
      <ClientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientTopbar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
