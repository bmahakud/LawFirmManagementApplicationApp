import { BillingHubPage } from '@/components/platform/page-templates';

export default function SuperAdminBillingPage() {
  return (
    <BillingHubPage
      accent="#984c1f"
      title="Firm Billing Management"
      description="Track invoices, advances, payment collection, and pending balances for active matters."
      viewBase="/super-admin/billing"
    />
  );
}
