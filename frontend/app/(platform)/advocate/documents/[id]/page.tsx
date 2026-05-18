import { DocumentDetailPage } from '@/components/platform/page-templates';

export default async function AdvocateDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetailPage accent="#4a1c40" roleTitle="Advocate" documentId={id} />;
}
