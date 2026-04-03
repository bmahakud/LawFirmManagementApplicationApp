import { NotFoundPage } from '@/components/platform/page-templates';

export default function RootNotFoundPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-20">
      <NotFoundPage
        title="This page does not exist in the current law-firm workspace."
        body="The route may be missing, renamed, or outside the implemented module map. Use the dashboard entry points to return to a valid workflow."
        href="/login"
        label="Back to Login"
      />
    </main>
  );
}
