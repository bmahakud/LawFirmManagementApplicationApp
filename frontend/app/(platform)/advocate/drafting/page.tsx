import { DraftsPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function AdvocateDraftingPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Drafting Workspace Coming Soon"
        message="Your smart document drafting, templates, and collaborative case prep tools are being configured for your firm."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <DraftsPage accent="#4a1c40" roleTitle="Advocate" viewBase="/advocate/drafting" />
      </div>
    </div>
  );
}
