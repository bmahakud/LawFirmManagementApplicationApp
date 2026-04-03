import { CasesPage } from '@/components/platform/page-templates';

export default function ClientCasesPage() {
  return (
    <CasesPage
      accent="#1f2937"
      title="My Cases"
      description="Simple case view for progress, hearing dates, documents, and billing visibility."
      viewBase="/client/cases"
    />
  );
}
