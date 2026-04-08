import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default function AddNewFirmPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/super-admin/my-firms" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Firm Branch</h1>
          <p className="text-gray-500 mt-1 text-sm">Fill in the details to create a new branch for your firm.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Name</label>
              <input type="text" placeholder="e.g. Downtown Branch" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
              <input type="text" placeholder="+1 (555) 000-0000" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea placeholder="Full address of the new branch" rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all"></textarea>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Email</label>
              <input type="email" placeholder="branch@example.com" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#984c1f]/20 focus:border-[#984c1f] transition-all" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
             <Link href="/super-admin/my-firms">
                <button type="button" className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
             </Link>
             <Link href="/super-admin/my-firms">
                <button type="button" className="px-5 py-2.5 text-sm font-semibold text-white bg-[#984c1f] rounded-lg hover:bg-[#7a3b16] transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Branch
                </button>
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
