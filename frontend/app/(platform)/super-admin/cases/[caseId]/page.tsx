import { CaseViewForm } from '@/components/platform/CaseViewEditForm';

export default function SuperAdminCaseDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Case Detail</h1>
        <p className="text-sm text-gray-500">Full matter overview with assignments, court info, and economics.</p>
      </div>
      <CaseViewForm editBase="/super-admin/cases" />
    </div>
  );
}
