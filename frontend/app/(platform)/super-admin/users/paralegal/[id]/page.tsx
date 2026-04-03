import { TeamMemberFormPage } from '@/components/platform/page-templates';

export default function SuperAdminParalegalDetail() {
  return (
    <TeamMemberFormPage
      accent="#984c1f"
      detail={true}
      title="Paralegal Profile"
      description="Review and update this paralegal's details and assignments."
    />
  );
}
