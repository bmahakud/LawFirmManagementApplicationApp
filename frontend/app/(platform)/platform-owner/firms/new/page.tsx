import CreateFirmForm from '@/components/platform/CreateFirmForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateNewFirmPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/platform-owner/firms" className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Law Firm</h1>
          <p className="text-gray-500 text-sm mt-1">Register a new client law firm to the platform infrastructure.</p>
        </div>
      </div>
      
      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <CreateFirmForm />
      </div>
    </div>
  );
}
