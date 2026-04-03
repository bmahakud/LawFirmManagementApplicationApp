import { NotFoundPage } from '@/components/platform/page-templates';

export default function AdvocateNotFoundPage() {
  return <NotFoundPage title="Advocate route not found" body="Return to your dashboard, assigned matters, drafting workspace, calendar, or client chat." href="/advocate/dashboard" label="Back to Dashboard" />;
}
