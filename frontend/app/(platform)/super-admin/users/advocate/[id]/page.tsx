import { TeamMemberFormPage } from '@/components/platform/page-templates';

export default function SuperAdminAdvocateDetail() {
  return (
    <TeamMemberFormPage
      accent="#984c1f"
      detail={true}
      title="Advocate Profile"
      description="Review and update this advocate's details, workload, and settings."
    />
  );
}
