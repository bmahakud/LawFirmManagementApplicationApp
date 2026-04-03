import { Building2, Users, Gavel, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const stats = [
  {
    title: 'Total Firms',
    value: '25',
    delta: '+3 this month',
    up: true,
    icon: Building2,
    color: 'bg-[#0e2340]/8 text-[#0e2340]',
    iconBg: 'bg-[#0e2340]',
  },
  {
    title: 'Active Users',
    value: '120',
    delta: '+12 this week',
    up: true,
    icon: Users,
    color: 'bg-emerald-50 text-emerald-700',
    iconBg: 'bg-emerald-600',
  },
  {
    title: 'Total Cases',
    value: '540',
    delta: '+28 this month',
    up: true,
    icon: Gavel,
    color: 'bg-blue-50 text-blue-700',
    iconBg: 'bg-blue-600',
  },
  {
    title: 'Platform Revenue',
    value: '₹4.2L',
    delta: '-2% vs last month',
    up: false,
    icon: TrendingUp,
    color: 'bg-[#c9a96e]/10 text-[#8a6a3a]',
    iconBg: 'bg-[#c9a96e]',
  },
];

export default function AnalyticsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map(({ title, value, delta, up, icon: Icon, iconBg }) => (
        <div
          key={title}
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-5">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${
                up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}
            >
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {delta}
            </span>
          </div>

          <p className="text-2xl font-bold text-[#0e2340] mb-1">{value}</p>
          <p className="text-xs text-gray-400 font-medium">{title}</p>
        </div>
      ))}
    </div>
  );
}