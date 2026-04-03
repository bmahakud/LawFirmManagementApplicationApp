import { FirmFormPage } from '@/components/platform/page-templates';

export default function PartnerManagerNewFirmPage() {
  return (
    <FirmFormPage
      accent="#1a6b4a"
      title="Onboard Assigned Firm"
      description="Create a new firm within partner scope, limited to firm basics, owner contacts, and plan context."
      limited
    />
  );
}
