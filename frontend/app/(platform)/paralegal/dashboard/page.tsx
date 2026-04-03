import { Briefcase, PenTool, CheckCircle, FileText } from 'lucide-react';

export default function ParalegalDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Cases Assigned', val: '8',  icon: Briefcase, color: 'bg-[#0a6c74]' },
          { label: 'Drafts to Review',val: '3',  icon: PenTool,   color: 'bg-emerald-500' },
          { label: 'Files Logged',   val: '14', icon: FileText,  color: 'bg-blue-600' },
          { label: 'Tasks Done',     val: '22', icon: CheckCircle,color: 'bg-teal-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-sm`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.val}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mt-6">
        <h2 className="text-lg font-bold text-[#0a6c74] mb-2">Welcome to your Paralegal Hub</h2>
        <p className="text-sm text-gray-500 max-w-lg mx-auto">
          Here you will assist advocates with draft reviews and timeline tracking. Note that client communication and draft approvals are restricted out of your scope.
        </p>
      </div>
    </div>
  );
}
