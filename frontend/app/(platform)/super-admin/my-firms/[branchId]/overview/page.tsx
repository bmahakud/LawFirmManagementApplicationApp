import { Plus, UserPlus, Shield } from 'lucide-react';

export default function BranchOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Branch Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the core details and administrational access for this branch.</p>
        </div>
        <button className="bg-[#984c1f] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7a3b16] transition-colors text-sm font-semibold">
          <UserPlus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Branch Information</h3>
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-semibold text-gray-500">Address</span>
              <span className="block text-base text-gray-900 mt-1">123 Main St, Cityville, State 12345</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-500">Contact Email</span>
              <span className="block text-base text-gray-900 mt-1">contact@downtownbranch.com</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-500">Phone Number</span>
              <span className="block text-base text-gray-900 mt-1">+1 (555) 123-4567</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1">
           <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Branch Admins</h3>
           <ul className="space-y-3">
             <li className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                 <Shield className="w-4 h-4 text-[#984c1f]" />
               </div>
               <div>
                  <span className="block text-sm font-semibold text-gray-900">John Doe</span>
                  <span className="block text-xs text-gray-500">johndoe@example.com</span>
               </div>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
}
