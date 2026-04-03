import { NotFoundPage } from '@/components/platform/page-templates';

export default function FirmAdminNotFoundPage() {
  return <NotFoundPage title="Firm-admin route not found" body="Return to your case operations, documents, drafts, invoices, or messaging workspace." href="/firm-admin/dashboard" label="Back to Dashboard" />;
}
