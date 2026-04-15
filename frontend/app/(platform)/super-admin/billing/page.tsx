import { BillingHubPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function SuperAdminBillingPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask 
        title="Billing Hub Coming Soon" 
        message="Full financial management, invoice generation, and automated remittance tracking are currently being integrated for all branches."
      />
      
      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <BillingHubPage
          accent="#984c1f"
          title="Firm Billing Management"
          description="Track invoices, advances, payment collection, and pending balances for active matters."
          viewBase="/super-admin/billing"
        />
      </div>
    </div>
  );
}
