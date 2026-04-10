'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, PlusCircle, Search, MoreVertical, CheckCircle2, XCircle, Trash2, PauseCircle, Eye, X, Save, ArrowRight } from 'lucide-react';

interface SalesPerson {
  id: number;
  name: string;
  email: string;
  phone: string;
  territory: string;
  target: number;
  achieved: number;
  status: 'Active' | 'Suspended';
  joinedAt: string;
}

const mock: SalesPerson[] = [
  { id: 1, name: 'Karan Mehta',   email: 'karan@antlegal.com',   phone: '+91 98001 55551', territory: 'Delhi NCR',    target: 500000, achieved: 420000, status: 'Active',    joinedAt: '10 Jan 2024' },
  { id: 2, name: 'Sneha Patil',   email: 'sneha@antlegal.com',   phone: '+91 98002 55552', territory: 'Pune & Mumbai', target: 400000, achieved: 390000, status: 'Active',    joinedAt: '20 Feb 2024' },
  { id: 3, name: 'Deepak Sharma', email: 'deepak@antlegal.com',  phone: '+91 98003 55553', territory: 'Chennai',       target: 300000, achieved: 110000, status: 'Suspended', joinedAt: '5 Apr 2024'  },
];

const emptyForm = { name: '', email: '', phone: '', territory: '', target: '', username: '', password: '' };

const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

export default function SalesPersonPage() {
  const pathname = usePathname();
  const [users, setUsers] = useState(mock);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.territory.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    setUsers(p => [...p, {
      id: Date.now(), name: form.name, email: form.email,
      phone: form.phone, territory: form.territory,
      target: Number(form.target) || 0, achieved: 0,
      status: 'Active', joinedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    }]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const toggleStatus = (id: number) =>
    setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));
  const remove = (id: number) => setUsers(p => p.filter(u => u.id !== id));

  const fields = [
    { k: 'name',      l: 'Full Name',      ph: 'Sales person name' },
    { k: 'email',     l: 'Email',          ph: 'sales@antlegal.com', type: 'email' },
    { k: 'phone',     l: 'Phone',          ph: '+91 98765 43210', type: 'tel' },
    { k: 'territory', l: 'Territory',      ph: 'e.g. Delhi NCR' },
    { k: 'target',    l: 'Monthly Target', ph: '500000', type: 'number' },
    { k: 'username',  l: 'Username',       ph: 'login username' },
    { k: 'password',  l: 'Password',       ph: '••••••••', type: 'password' },
  ];

  const totalTarget   = users.reduce((a, u) => a + u.target, 0);
  const totalAchieved = users.reduce((a, u) => a + u.achieved, 0);
  const avgAchievement = totalTarget ? Math.round((totalAchieved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0e2340]">Sales Persons</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track and manage your sales team's accounts and targets</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-[#6C5CE7] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a4bd1] transition-colors shadow-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Sales Person'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales Persons', value: String(users.length),          color: 'bg-[#6C5CE7]' },
          { label: 'Active',             value: String(users.filter(u => u.status === 'Active').length), color: 'bg-emerald-500' },
          { label: 'Total Target',       value: fmt(totalTarget),               color: 'bg-blue-500' },
          { label: 'Avg Achievement',    value: `${avgAchievement}%`,           color: avgAchievement >= 80 ? 'bg-emerald-500' : 'bg-amber-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <TrendingUp className="w-4.5 h-4.5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#0e2340]">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 bg-[#6C5CE7] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0e2340]">New Sales Person</p>
              <p className="text-xs text-gray-400">Create a sales person account with territory and target</p>
            </div>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(({ k, l, ph, type }) => (
              <div key={k} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{l}</label>
                <input
                  type={type ?? 'text'}
                  value={(form as any)[k]}
                  onChange={e => set(k, e.target.value)}
                  placeholder={ph}
                  className="h-10 px-3.5 rounded-xl border border-gray-200 bg-[#f7f8fa] text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-[#6C5CE7]/50 focus:ring-2 focus:ring-[#6C5CE7]/10 transition-all"
                />
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button onClick={handleAdd} className="flex items-center gap-2 bg-[#6C5CE7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a4bd1] transition-colors">
              <Save className="w-4 h-4" /> Save Sales Person
            </button>
            <button onClick={() => { setForm(emptyForm); setShowForm(false); }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-[#0e2340]">{users.length} Sales Persons</p>
          <div className="flex items-center gap-2 bg-[#f7f8fa] border border-gray-100 rounded-xl px-3 py-2 w-56">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name / area…" className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-[#f7f8fa] border-b border-gray-100">
                {['Sl. No', 'Sales Person', 'Email', 'Territory', 'Target', 'Achieved', 'Progress', 'Status', 'Joined', 'View', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((u, index) => {
                const pct = u.target ? Math.min(100, Math.round((u.achieved / u.target) * 100)) : 0;
                return (
                  <tr key={u.id} className="hover:bg-[#f7f8fa]/60 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{(safePage - 1) * pageSize + index + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] text-[11px] font-bold shrink-0">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <p className="text-sm font-semibold text-[#0e2340]">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.territory}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{fmt(u.target)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">{fmt(u.achieved)}</td>
                    <td className="px-5 py-3.5 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        u.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {u.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{u.joinedAt}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`${pathname}/${u.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#0e2340] hover:bg-gray-50"
                      >
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 relative">
                      <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute right-6 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1">
                          <button onClick={() => setOpenMenu(null)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"><Eye className="w-3.5 h-3.5 text-gray-400" /> View</button>
                          <button onClick={() => { toggleStatus(u.id); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50"><PauseCircle className="w-3.5 h-3.5" /> {u.status === 'Active' ? 'Suspend' : 'Reactivate'}</button>
                          <div className="h-px bg-gray-100 my-1" />
                          <button onClick={() => { remove(u.id); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-[#f7f8fa]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Showing {paged.length} of {filtered.length} entries</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100">Prev</button>
              <span className="text-xs font-semibold text-gray-500">{safePage} / {pageCount}</span>
              <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
