import { InvoicesPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function FirmAdminInvoicesPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Invoices Coming Soon"
        message="Firm-wide billing, invoice generation, and account receivables management are currently being integrated."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <InvoicesPage
          accent="#2a4365"
          roleTitle="Firm Admin"
          viewBase="/firm-admin/invoices"
        />
      </div>
    </div>
  );
}
