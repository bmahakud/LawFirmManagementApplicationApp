import { CalendarPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function ClientCalendarPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Calendar Coming Soon"
        message="Scheduling, hearing dates, and case milestones will be available in your personal client calendar shortly."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <CalendarPage accent="#1f2937" roleTitle="Client" />
      </div>
    </div>
  );
}
