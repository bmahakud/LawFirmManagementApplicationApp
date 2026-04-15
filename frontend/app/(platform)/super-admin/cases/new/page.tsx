import CaseAddForm from '@/components/platform/CaseAddForm';

export default function AddCasePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register New Matter</h1>
        <p className="text-sm text-gray-500">Assign legal classification, personnel, and branch allocation.</p>
      </div>
      <CaseAddForm />
    </div>
  );
}
