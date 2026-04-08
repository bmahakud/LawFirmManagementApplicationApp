import Link from 'next/link';
import FirmTable from '@/components/platform/FirmTable';
import { Plus } from 'lucide-react';

export default function PlatformOwnerFirmsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Law Firms Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all registered law firms on the platform.</p>
        </div>
        <Link 
          href="/platform-owner/firms/new" 
          className="flex items-center gap-2 bg-[#0e2340] hover:bg-[#15345d] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create New Firm
        </Link>
      </div>

      <FirmTable />
    </div>
  );
}
