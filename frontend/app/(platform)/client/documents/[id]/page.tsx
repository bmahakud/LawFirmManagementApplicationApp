import { DocumentDetailPage } from '@/components/platform/page-templates';

export default async function ClientDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetailPage accent="#0e2340" roleTitle="Client" documentId={id} />;
}
