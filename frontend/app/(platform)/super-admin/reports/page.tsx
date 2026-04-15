import { ReportsPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function SuperAdminReportsPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask 
        title="Reporting Hub Coming Soon" 
        message="Advanced firm performance analytics, case conversion metrics, and workload distribution reports are currently being developed."
      />
      
      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <ReportsPage accent="#984c1f" />
      </div>
    </div>
  );
}
