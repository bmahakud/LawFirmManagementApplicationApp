import CreateFirmForm from '@/components/platform/CreateFirmForm';
import FirmTable from '@/components/platform/FirmTable';

export default function PlatformOwnerFirmsPage() {
  return (
    <div className="space-y-2">
      <CreateFirmForm />
      <FirmTable />
    </div>
  );
}
