import SalesPage from '@/components/platform/sales';
import { ComingSoonMask } from '@/components/platform/ui';

export default function PlatformOwnerSalesPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask 
        title="CRM & Sales Pipeline Coming Soon" 
        message="Advanced lead management, conversion tracking, and sales performance analytics for the platform sales team are currently being built."
      />
      
      {/* Background content */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <SalesPage />
      </div>
    </div>
  );
}
