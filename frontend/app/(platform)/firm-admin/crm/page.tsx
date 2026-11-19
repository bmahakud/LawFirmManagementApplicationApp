'use client';

import CrmLeadPipeline from '@/components/platform/CrmLeadPipeline';

export default function FirmAdminCrmPage() {
  return <CrmLeadPipeline baseCaseUrl="/firm-admin/cases" userRole="firm-admin" />;
}

