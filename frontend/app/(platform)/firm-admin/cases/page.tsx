import { CasesPage } from '@/components/platform/page-templates';

export default function FirmAdminCasesPage() {
  return (
    <CasesPage
      accent="#2a4365"
      title="Admin Case Operations"
      description="Assign cases, monitor hearing history, review document flow, and manage operational updates."
      viewBase="/firm-admin/cases"
    />
  );
}
