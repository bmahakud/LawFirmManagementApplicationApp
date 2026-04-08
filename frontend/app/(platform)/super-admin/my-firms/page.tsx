import Link from 'next/link';
import { Store, Plus, ArrowRight, MapPin } from 'lucide-react';

const mockFirmBranches = [
  { id: 'branch-1', name: 'Downtown Branch', address: '123 Main St, Cityville' },
  { id: 'branch-2', name: 'Uptown Branch', address: '456 North Ave, Townsville' },
];

export default function MyFirmsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Firms</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage all your firm branches and locations.</p>
        </div>
        <Link href="/super-admin/my-firms/new">
          <button className="bg-[#984c1f] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7a3b16] transition-colors text-sm font-semibold">
            <Plus className="w-4 h-4" />
            Add New Firm
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <ul className="divide-y divide-gray-100">
          {mockFirmBranches.map((branch) => (
            <li key={branch.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#984c1f]/10 flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6 text-[#984c1f]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-[#984c1f] transition-colors">{branch.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{branch.address}</span>
                  </div>
                </div>
              </div>
              <Link href={`/super-admin/my-firms/${branch.id}/overview`}>
                <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#984c1f] bg-[#984c1f]/5 rounded-lg hover:bg-[#984c1f]/10 transition-colors">
                  View
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
