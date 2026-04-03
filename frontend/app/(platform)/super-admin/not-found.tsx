import { NotFoundPage } from '@/components/platform/page-templates';

export default function SuperAdminNotFoundPage() {
  return <NotFoundPage title="Firm-owner route not found" body="Return to the firm dashboard, cases, team, clients, billing, reports, or settings modules." href="/super-admin/dashboard" label="Back to Dashboard" />;
}
