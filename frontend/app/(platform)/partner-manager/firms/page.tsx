import CreateFirmForm from '@/components/platform/CreateFirmForm';
import FirmTable from '@/components/platform/FirmTable';

export default function PartnerManagerFirmsPage() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
        <strong className="font-semibold">Note:</strong> As a Partner Manager, you can create new firms and view basic details. You cannot suspend, delete, or view internal firm data.
      </div>
      <CreateFirmForm />
      <FirmTable />
    </div>
  );
}
