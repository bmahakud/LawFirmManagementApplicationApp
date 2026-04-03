import { NotFoundPage } from '@/components/platform/page-templates';

export default function ClientNotFoundPage() {
  return <NotFoundPage title="Client route not found" body="Return to your dashboard, cases, documents, hearings, invoices, or messages." href="/client/dashboard" label="Back to Dashboard" />;
}
