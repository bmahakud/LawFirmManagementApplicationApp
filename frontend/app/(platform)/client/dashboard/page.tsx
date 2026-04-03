import { Scale, Clock, MessageSquare, Download, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboard() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Cases',   val: '1',  icon: Scale,     color: 'bg-[#1f2937]' },
          { label: 'Next Hearing',   val: '12th', icon: Calendar,  color: 'bg-indigo-600' },
          { label: 'New Messages',   val: '2',  icon: MessageSquare, color: 'bg-emerald-600' },
          { label: 'Unpaid Invoices',val: '0',  icon: Clock,     color: 'bg-gray-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm transition-transform group-hover:scale-110`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Case Updates: Doe vs Corporate Ltd</h2>
          <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">Hearing Stage</span>
        </div>
        <div className="p-6 space-y-8">
          {[
            { date: '12 May 2024', status: 'Next Hearing Scheduled', desc: 'Please ensure you are present at the City Civil Court by 10 AM.', current: true },
            { date: '01 May 2024', status: 'Draft Petition Filed',   desc: 'Adv. S. Sharma filed the petition in registry.', current: false },
            { date: '15 Apr 2024', status: 'Case Initiated',         desc: 'Initial documents submitted and verified.', current: false },
          ].map((item, idx) => (
            <div key={idx} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 bg-white ${item.current ? 'border-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' : 'border-gray-300'}`} />
                {idx !== 2 && <div className="w-0.5 h-full bg-gray-100 mt-2" />}
              </div>
              <div className="pb-2">
                <span className="text-xs font-bold text-gray-400">{item.date}</span>
                <p className={`text-sm font-bold mt-1 ${item.current ? 'text-indigo-600' : 'text-gray-900'}`}>{item.status}</p>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Recent Documents</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { name: 'Initial_Petition_Signed.pdf', size: '2.4 MB' },
              { name: 'Evidence_Annexure_A.pdf',     size: '5.1 MB' },
            ].map(doc => (
              <div key={doc.name} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.size}</p>
                  </div>
                </div>
                <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-2xl border border-gray-800 shadow-lg p-6 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold">Need Help?</h2>
            <p className="text-sm text-gray-400 mt-2">Send a direct message to your assigned advocate. We usually reply within 2 hours.</p>
          </div>
          <Link href="/client/messaging" className="mt-6 bg-white text-gray-900 font-bold py-3 px-4 rounded-xl text-center text-sm shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Message Advocate
          </Link>
        </div>
      </div>
    </div>
  );
}
