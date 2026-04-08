import { UserPlus, UserCircle2 } from 'lucide-react';

const mockClients = [
  { id: 1, name: 'Eve Wilson', email: 'eve@acmecorp.com', type: 'Corporate' },
];

export default function BranchClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Branch Clients</h2>
          <p className="text-sm text-gray-500 mt-1">List of clients assigned to this branch.</p>
        </div>
        <button className="bg-[#984c1f] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#7a3b16] transition-colors text-sm font-semibold">
          <UserPlus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Client Type</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserCircle2 className="w-8 h-8 text-gray-400" />
                    <span className="font-semibold text-gray-900">{client.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{client.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-[#984c1f]">
                    {client.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm text-[#984c1f] hover:underline font-medium">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
