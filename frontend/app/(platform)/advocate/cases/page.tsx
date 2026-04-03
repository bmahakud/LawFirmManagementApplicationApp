import { CasesPage } from '@/components/platform/page-templates';

export default function AdvocateCasesPage() {
  return (
    <CasesPage
      accent="#4a1c40"
      title="Assigned Matters"
      description="Review assigned cases, evidence status, next hearings, and drafting workload."
      viewBase="/advocate/cases"
    />
  );
}
