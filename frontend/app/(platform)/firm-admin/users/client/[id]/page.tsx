import { UserDetailPage } from '@/components/platform/page-templates';

export default async function FirmAdminClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <UserDetailPage
      accent="#2a4365"
      userId={id}
    />
  );
}
