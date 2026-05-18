import { DocumentDetailPage } from '@/components/platform/page-templates';

export default async function FirmAdminDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetailPage accent="#1e3a8a" roleTitle="Firm Admin" documentId={id} />;
}
