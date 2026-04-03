import AnalyticsCards from '@/components/platform/AnalyticsCards';
import { TrendingUp } from 'lucide-react';

const monthlyData = [
  { month: 'Jan', firms: 18, cases: 310, revenue: 280000 },
  { month: 'Feb', firms: 19, cases: 340, revenue: 310000 },
  { month: 'Mar', firms: 20, cases: 380, revenue: 345000 },
  { month: 'Apr', firms: 21, cases: 410, revenue: 390000 },
  { month: 'May', firms: 22, cases: 460, revenue: 420000 },
  { month: 'Jun', firms: 25, cases: 540, revenue: 465000 },
];

const topFirms = [
  { name: 'Torres Law Group',  cases: 230, revenue: 78000, pct: 100 },
  { name: 'Chen & Associates', cases: 88,  revenue: 45000, pct: 58  },
  { name: 'Wright & Partners', cases: 67,  revenue: 29000, pct: 37  },
  { name: 'Legal Experts LLP', cases: 120, revenue: 20000, pct: 26  },
  { name: 'Davis Legal',       cases: 42,  revenue: 15000, pct: 19  },
];

const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));

export default function PlatformOwnerAnalyticsPage() {
  return (
    <div className="space-y-8">
      <AnalyticsCards />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-[#0e2340]">Platform Revenue</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly billing — Jan to Jun 2024</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> +18% vs last period
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-end gap-4 h-48">
              {monthlyData.map(({ month, revenue }) => {
                const h = Math.round((revenue / maxRevenue) * 100);
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-semibold text-[#0e2340] opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{(revenue / 1000).toFixed(0)}k
                    </span>
                    <div className="w-full relative" style={{ height: `${h}%` }}>
                      <div className="w-full h-full bg-[#0e2340]/8 rounded-t-lg group-hover:bg-[#0e2340]/15 transition-colors" />
                      <div
                        className="absolute bottom-0 w-full bg-[#0e2340] rounded-t-lg transition-all"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0e2340]">Top Firms</h2>
            <p className="text-xs text-gray-400 mt-0.5">By revenue generated</p>
          </div>
          <div className="px-6 py-4 space-y-4">
            {topFirms.map(({ name, cases, revenue, pct }, i) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
                    <span className="text-sm font-semibold text-[#0e2340] truncate max-w-[130px]">{name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0e2340]">₹{(revenue / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0e2340] to-[#1a3a5c]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{cases} cases</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#0e2340]">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f7f8fa]">
                {['Month', 'Firms', 'Cases', 'Revenue', 'Growth'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyData.map(({ month, firms, cases, revenue }, idx) => {
                const prev = monthlyData[idx - 1];
                const growth = prev ? (((revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : null;
                return (
                  <tr key={month} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-[#0e2340]">{month} 2024</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{firms}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cases}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">₹{(revenue / 1000).toFixed(0)}k</td>
                    <td className="px-6 py-4">
                      {growth ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+{growth}%</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}