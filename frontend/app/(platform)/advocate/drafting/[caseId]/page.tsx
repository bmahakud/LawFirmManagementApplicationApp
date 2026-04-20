import { DraftDetailPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function AdvocateDraftDetailPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Document Editor Coming Soon"
        message="The advanced legal document editor, version control, and real-time collaboration features are being finalized."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <DraftDetailPage accent="#4a1c40" roleTitle="Advocate" />
      </div>
    </div>
  );
}
