import { DocumentDetailPage } from '@/components/platform/page-templates';

export default async function FirmAdminDocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  return <DocumentDetailPage accent="#2a4365" roleTitle="Firm Admin" documentId={documentId} />;
}
