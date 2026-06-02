import { DraftsPage } from '@/components/platform/page-templates';

export default function AdvocateDraftingPage() {
  return (
    <div className="space-y-6">
      <div className="bg-purple-900/5 border border-purple-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-purple-900 font-medium">
          💡 Tip: You can also draft case-specific documents directly from any <b>Case Detail &gt; Drafting</b> tab to auto-populate matter details.
        </p>
      </div>
      <DraftsPage accent="#4a1c40" roleTitle="Advocate" viewBase="/advocate/drafting" />
    </div>
  );
}
