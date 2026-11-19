'use client';

import CrmLeadPipeline from '@/components/platform/CrmLeadPipeline';

export default function AdvocateCrmPage() {
  return <CrmLeadPipeline baseCaseUrl="/advocate/cases" userRole="advocate" />;
}

