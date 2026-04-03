import { TeamMemberFormPage } from '@/components/platform/page-templates';

export default function FirmAdminAdvocateDetail() {
  return (
    <TeamMemberFormPage
      accent="#2a4365"
      detail={true}
      title="Advocate Profile"
      description="Review and update this advocate's details, workload, and settings."
    />
  );
}
