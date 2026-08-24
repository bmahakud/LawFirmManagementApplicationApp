'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import PDFCourtFormEditor from '@/components/platform/PDFCourtFormEditor';

export default function AdvocateCourtFormDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params?.id as string;
  const fromCase = searchParams?.get('fromCase');

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        if (fromCase) {
          router.replace(`/advocate/cases/${fromCase}?tab=Documents&subtab=court_forms&formId=${formId}`);
          return;
        }

        const res = await customFetch(API.DOCUMENTS.FILLED_COURT_FORMS.DETAIL(formId));
        if (res.ok) {
          const data = await res.json();
          setFormData(data);
          const caseId = data.case || data.case_id;
          if (caseId) {
            router.replace(`/advocate/cases/${caseId}?tab=Documents&subtab=court_forms&formId=${formId}`);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching court form:', err);
      } finally {
        setLoading(false);
      }
    };

    if (formId) {
      fetchAndRedirect();
    }
  }, [formId, fromCase, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-semibold text-gray-500">Opening Court Form...</p>
      </div>
    );
  }

  const caseId = fromCase || formData?.case || formData?.case_id;

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[85vh]">
      <PDFCourtFormEditor
        caseId={caseId || ''}
        clientId={formData?.client || formData?.client_id || ''}
        role="advocate"
        accent="#4a1c40"
        initialFormId={formId}
      />
    </div>
  );
}
