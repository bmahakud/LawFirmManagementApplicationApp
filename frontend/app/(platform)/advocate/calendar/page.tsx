import { CalendarPage } from '@/components/platform/page-templates';
import { ComingSoonMask } from '@/components/platform/ui';

export default function AdvocateCalendarPage() {
  return (
    <div className="space-y-6">
      <ComingSoonMask
        title="Advocate Calendar Coming Soon"
        message="Your centralized hearing schedule, court dates, and matter milestones are currently being synchronized."
      />

      {/* Hidden background content for structure */}
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        <CalendarPage accent="#4a1c40" roleTitle="Advocate" />
      </div>
    </div>
  );
}
