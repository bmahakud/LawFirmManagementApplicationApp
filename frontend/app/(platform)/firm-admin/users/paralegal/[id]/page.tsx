import { TeamMemberFormPage } from '@/components/platform/page-templates';

export default function FirmAdminParalegalDetail() {
  return (
    <TeamMemberFormPage
      accent="#2a4365"
      detail={true}
      title="Paralegal Profile"
      description="Review and update this paralegal's details and assignments."
    />
  );
}
