import { MessagingPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function AdvocateChatPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Chat Coming Soon"
        message="Real-time multi-party chat, client notifications, and internal team messaging are currently being developed."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <MessagingPage accent="#4a1c40" roleTitle="Advocate" />
      </div>
    </div>
  );
}
