import { MessagingPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function FirmAdminMessagingPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Messaging Coming Soon"
        message="Centralized communication, case chat monitoring, and team collaboration features are currently being built."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <MessagingPage
          accent="#2a4365"
          roleTitle="Firm Admin"
        />
      </div>
    </div>
  );
}
