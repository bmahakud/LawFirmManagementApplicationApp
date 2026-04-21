import { DocumentDetailPage } from '@/components/platform/page-templates';

export default async function SuperAdminDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetailPage accent="#984c1f" roleTitle="Super Admin" documentId={id} />;
}
