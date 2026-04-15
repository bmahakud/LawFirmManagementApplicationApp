import { CaseEditForm } from '@/components/platform/CaseViewEditForm';

export default function SuperAdminCaseEditPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Case</h1>
        <p className="text-sm text-gray-500">Update matter details, assignments, and case status.</p>
      </div>
      <CaseEditForm viewBase="/super-admin/cases" />
    </div>
  );
}
