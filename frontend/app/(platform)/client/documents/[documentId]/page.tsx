import { DocumentDetailPage } from '@/components/platform/page-templates';

export default async function ClientDocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  return <DocumentDetailPage accent="#1f2937" roleTitle="Client" documentId={documentId} />;
}
