import { CasesPage } from '@/components/platform/page-templates';

export default function SuperAdminCasesPage() {
  return (
    <CasesPage
      accent="#984c1f"
      title="Firm Case Register"
      description="Create and manage matters, assign advocates and paralegals, monitor act extraction, and review case lifecycle history."
      primaryHref="/super-admin/cases/new"
      primaryLabel="Create New Case"
      viewBase="/super-admin/cases"
    />
  );
}
