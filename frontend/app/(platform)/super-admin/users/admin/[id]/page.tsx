import { TeamMemberFormPage } from '@/components/platform/page-templates';

export default function SuperAdminAdminDetail() {
  return (
    <TeamMemberFormPage
      accent="#984c1f"
      detail={true}
      title="Admin Profile"
      description="Review and update this firm admin's details."
    />
  );
}
