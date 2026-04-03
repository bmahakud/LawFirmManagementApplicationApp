import { NotFoundPage } from '@/components/platform/page-templates';

export default function PlatformOwnerNotFoundPage() {
  return <NotFoundPage title="Platform-owner route not found" body="Use the dashboard, firms, analytics, billing, or settings modules to continue." href="/platform-owner/dashboard" label="Back to Dashboard" />;
}
