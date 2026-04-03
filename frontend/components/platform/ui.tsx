'use client';

import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const toneMap: Record<Tone, string> = {
  default: 'bg-gray-100 text-gray-600 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function PageSection({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function ActionLink({
  href,
  label,
  tone = 'dark',
}: {
  href: string;
  label: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <Link
      href={href}
      className={classNames(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
        tone === 'dark'
          ? 'bg-[#0e2340] text-white hover:bg-[#1a3a5c]'
          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      )}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  accent = '#0e2340',
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 h-1.5 w-12 rounded-full" style={{ backgroundColor: accent }} />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={classNames('overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm', className)}>
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-gray-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-[#f7f8fa] px-3 py-2">
      <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

export function Badge({ label, tone = 'default' }: { label: string; tone?: Tone }) {
  return (
    <span className={classNames('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold', toneMap[tone])}>
      {label}
    </span>
  );
}

export function DetailList({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 2 | 3;
}) {
  return (
    <div className={classNames('grid gap-4', columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-100 bg-[#f7f8fa] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">{item.label}</p>
          <div className="mt-2 text-sm font-semibold text-gray-700">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function Timeline({
  items,
}: {
  items: Array<{ title: string; subtitle: string; tone?: Tone }>;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex gap-4">
          <div className="flex w-6 flex-col items-center">
            <span className={classNames('h-3 w-3 rounded-full border', toneMap[item.tone ?? 'default'])} />
            {index < items.length - 1 ? <span className="mt-1 h-full w-px bg-gray-200" /> : null}
          </div>
          <div className="pb-4">
            <p className="text-sm font-semibold text-gray-800">{item.title}</p>
            <p className="mt-1 text-xs text-gray-400">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({
  items,
}: {
  items: Array<{ actor: string; action: string; time: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.actor}-${index}`} className="rounded-xl border border-gray-100 bg-[#f7f8fa] p-4">
          <p className="text-sm font-semibold text-gray-800">
            {item.actor}
            <span className="font-normal text-gray-600"> {item.action}</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">{item.time}</p>
        </div>
      ))}
    </div>
  );
}

export function DocumentHistory({
  rows,
  viewBase,
}: {
  rows: Array<{ name: string; type: string; version: string; uploadedBy: string; date: string }>;
  viewBase?: string;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredRows = useMemo(
    () =>
      rows
        .map((row, index) => ({ ...row, rowId: index + 1 }))
        .filter((row) =>
          [row.name, row.type, row.version, row.uploadedBy, row.date].some((value) =>
            value.toLowerCase().includes(query.toLowerCase())
          )
        ),
    [query, rows]
  );

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-[#f7f8fa] px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search documents..."
          className="w-full bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-[#f7f8fa]">
              {['Sl. No', 'Document', 'Type', 'Version', 'Uploaded By', 'Date', 'View'].map((head) => (
                <th key={head} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedRows.map((row, index) => (
              <tr key={`${row.name}-${row.version}`}>
                <td className="px-4 py-4 text-sm font-semibold text-gray-700">{(safePage - 1) * pageSize + index + 1}</td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-800">{row.name}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{row.type}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{row.version}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{row.uploadedBy}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{row.date}</td>
                <td className="px-4 py-4">
                  {viewBase ? (
                    <Link href={`${viewBase}/${row.rowId}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#0e2340] hover:bg-gray-50">
                      View
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#0e2340] hover:bg-gray-50">
                      View
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400">Showing {pagedRows.length} of {filteredRows.length} entries</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-gray-500">{safePage} / {pageCount}</span>
          <button
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function SimpleTabs({
  tabs,
}: {
  tabs: Array<{ label: string; active?: boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className={classNames(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
            tab.active ? 'bg-[#0e2340] text-white' : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function FormGrid({
  fields,
  columns = 2,
}: {
  fields: Array<{ label: string; placeholder: string; type?: string; wide?: boolean }>;
  columns?: 2 | 3;
}) {
  return (
    <div className={classNames('grid gap-4', columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
      {fields.map((field) => (
        <div key={`${field.label}-${field.placeholder}`} className={field.wide ? 'md:col-span-2' : ''}>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              placeholder={field.placeholder}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          ) : (
            <input
              type={field.type ?? 'text'}
              placeholder={field.placeholder}
              className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function SplitPanels({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">{left}{right}</div>;
}

export function RecoveryCard({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Page Not Found</p>
      <h1 className="mt-3 text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mt-4 text-sm leading-6 text-gray-500">{body}</p>
      <div className="mt-8">
        <ActionLink href={href} label={label} />
      </div>
    </div>
  );
}
