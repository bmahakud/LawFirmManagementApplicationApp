import { DraftsPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function FirmAdminDraftsPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Drafts Management Coming Soon"
        message="Reviewing pending documents, internal drafts, and firm-wide approval workflows are currently being integrated."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <DraftsPage
          accent="#2a4365"
          roleTitle="Firm Admin"
          approvalMode
          viewBase="/firm-admin/drafts"
        />
      </div>
    </div>
  );
}
