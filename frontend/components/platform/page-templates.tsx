'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  CreditCard,
  FileText,
  Gavel,
  MessageSquare,
  PenTool,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  ActivityFeed,
  ActionLink,
  Badge,
  DetailList,
  DocumentHistory,
  FormGrid,
  MetricCard,
  PageSection,
  Panel,
  RecoveryCard,
  SearchBar,
  SimpleTabs,
  SplitPanels,
  Timeline,
} from '@/components/platform/ui';
import {
  activityRows,
  caseFormFields,
  caseTimeline,
  clientFields,
  documentRows,
  hearingRows,
  invoiceRows,
  reportCards,
  teamFields,
} from '@/components/platform/mock-data';

type AccentProps = {
  accent: string;
};

type Metric = {
  label: string;
  value: string;
  hint?: string;
};

type TableColumn = {
  key: string;
  label: string;
};

type TableRow = Record<string, string | undefined> & {
  viewHref?: string;
};

function MetricGrid({ accent, metrics }: AccentProps & { metrics: Metric[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} accent={accent} {...metric} />
      ))}
    </div>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: TableColumn[];
  rows: TableRow[];
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        Object.entries(row)
          .filter(([key]) => key !== 'viewHref')
          .some(([, value]) => String(value).toLowerCase().includes(query.toLowerCase()))
      ),
    [query, rows]
  );

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-[#f7f8fa] px-3 py-2">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search list..."
          className="w-full bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-[#f7f8fa]">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Sl. No</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedRows.map((row, index) => (
              <tr key={`${row[columns[0].key]}-${index}`}>
                <td className="px-4 py-4 text-sm font-semibold text-gray-700">{(safePage - 1) * pageSize + index + 1}</td>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 text-sm text-gray-600">
                    {row[column.key]}
                  </td>
                ))}
                <td className="px-4 py-4">
                  {row.viewHref ? (
                    <Link href={row.viewHref} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#0e2340] hover:bg-gray-50">
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
        <p className="text-xs text-gray-400">
          Showing {pagedRows.length} of {filteredRows.length} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-gray-500">
            {safePage} / {pageCount}
          </span>
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

function InfoAside({ accent, title, items }: AccentProps & { title: string; items: string[] }) {
  return (
    <Panel title={title} subtitle="Implementation placeholder">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-[#f7f8fa] p-4">
            <div className="mt-0.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
            <p className="text-sm text-gray-600">{item}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const caseRows = [
  {
    matter: 'State vs Mehta',
    number: 'CRL-2026-1042',
    acts: 'IPC 420, CrPC 154',
    status: 'Evidence Stage',
    advocate: 'Ritika Iyer',
    hearing: '31 Mar 2026',
  },
  {
    matter: 'Apex Traders Arbitration',
    number: 'ARB-2026-031',
    acts: 'Arbitration Act',
    status: 'Draft Filing',
    advocate: 'Arjun Sharma',
    hearing: '04 Apr 2026',
  },
  {
    matter: 'Kumar Property Appeal',
    number: 'CIV-2026-220',
    acts: 'Transfer of Property Act',
    status: 'Judgment Reserved',
    advocate: 'Neha Sethi',
    hearing: '07 Apr 2026',
  },
];

export function PlatformFirmsHub({ accent, limited }: AccentProps & { limited?: boolean }) {
  const metrics = limited
    ? [
      { label: 'Assigned Firms', value: '18', hint: '9 active this week' },
      { label: 'Pending Onboarding', value: '4', hint: 'Awaiting owner confirmation' },
      { label: 'Renewals Due', value: '6', hint: 'Next 30 days' },
      { label: 'Partner Notes', value: '12', hint: 'Internal follow-ups open' },
    ]
    : [
      { label: 'Total Firms', value: '148', hint: '22 onboarded this month' },
      { label: 'Active Users', value: '1,264', hint: 'Across all law firms' },
      { label: 'Pending Bills', value: 'Rs. 8.2L', hint: 'Platform-wide receivables' },
      { label: 'Login Audits', value: '4,920', hint: 'Last 30 days' },
    ];

  const rows = limited
    ? [
      { firm: 'Legal Experts LLP', owner: 'Arjun Sharma', plan: 'Growth', status: 'Active', renewal: '18 Apr 2026', activity: 'Case sync yesterday' },
      { firm: 'Mehra Chambers', owner: 'K. Mehra', plan: 'Trial', status: 'Pending', renewal: '05 Apr 2026', activity: 'OTP pending' },
    ]
    : [
      { firm: 'Chen & Associates', owner: 'Sarah Chen', plan: 'Enterprise', status: 'Active', renewal: '15 Apr 2026', activity: '144 sign-ins this week' },
      { firm: 'Torres Law Group', owner: 'Michael Torres', plan: 'Growth', status: 'Active', renewal: '30 Apr 2026', activity: '12 new matters' },
      { firm: 'Davis Legal', owner: 'Emily Davis', plan: 'Trial', status: 'Suspended', renewal: 'Expired', activity: 'Payment failed twice' },
    ];

  return (
    <div className="space-y-8">
      <PageSection
        eyebrow={limited ? 'Assigned Firms' : 'Platform Firms'}
        title={limited ? 'Firm Onboarding and Relationship Desk' : 'Law Firm Management'}
        description={
          limited
            ? 'Create firms, review basic details, and manage relationship notes without exposing internal firm matters.'
            : 'Register firms, manage owner credentials, assign partner or sales ownership, and review billing, login, and adoption signals.'
        }
        actions={
          <>
            <ActionLink href={limited ? '/partner-manager/firms/new' : '/platform-owner/firms/new'} label="Create Firm" />
            <ActionLink href={limited ? '/partner-manager/settings' : '/platform-owner/billing'} label={limited ? 'Partner Settings' : 'Review Billing'} tone="light" />
          </>
        }
      />
      <MetricGrid accent={accent} metrics={metrics} />
      <SplitPanels
        left={
          <Panel
            title={limited ? 'Assigned Firms' : 'Firm Directory'}
            subtitle="Searchable overview of law firms, plans, and owner credentials."
            actions={<SearchBar placeholder="Search firms, owners, or codes..." />}
          >
            <DataTable
              columns={[
                { key: 'firm', label: 'Firm' },
                { key: 'owner', label: 'Owner' },
                { key: 'plan', label: 'Plan' },
                { key: 'status', label: 'Status' },
                { key: 'renewal', label: 'Renewal' },
                { key: 'activity', label: 'Recent Activity' },
              ]}
              rows={rows}
            />
          </Panel>
        }
        right={
          <InfoAside
            accent={accent}
            title={limited ? 'Restricted Access' : 'Platform Controls'}
            items={
              limited
                ? [
                  'No access to cases, documents, or internal team records.',
                  'Editable fields stay limited to firm basics, contacts, and plan context.',
                  'Internal relationship notes remain partner-facing only.',
                ]
                : [
                  'Firm records remain platform-owned and cannot be deleted from firm-owner accounts.',
                  'Login history, sign-up activity, and billing stats are visible at platform level.',
                  'Referral, partner, and sales ownership are tracked per firm record.',
                ]
            }
          />
        }
      />
    </div>
  );
}

export function FirmFormPage({
  accent,
  title,
  description,
  limited,
}: AccentProps & { title: string; description: string; limited?: boolean }) {
  const firmFields = [
    { label: 'Firm Name', placeholder: 'Chen & Associates' },
    { label: 'Firm Code', placeholder: 'CHEN-2026' },
    { label: 'Owner Full Name', placeholder: 'Sarah Chen' },
    { label: 'Email Address', placeholder: 'owner@firm.com', type: 'email' },
    { label: 'Phone Number', placeholder: '+91 98XXXXXX45' },
    { label: 'Username', placeholder: 'sarah.chen' },
    { label: 'Password', placeholder: 'Auto-generated or set by owner', type: 'password' },
    { label: 'City', placeholder: 'Mumbai' },
    { label: 'State', placeholder: 'Maharashtra' },
    { label: 'Country', placeholder: 'India' },
    { label: 'Plan', placeholder: limited ? 'Growth' : 'Enterprise' },
    { label: 'Referral / Sales Owner', placeholder: limited ? 'Current Partner Manager' : 'Assigned sales person' },
  ];

  return (
    <div className="space-y-8">
      <PageSection eyebrow="Onboarding" title={title} description={description} />
      <SplitPanels
        left={
          <Panel title="Firm Registration Form" subtitle="Minimal firm record, owner credentials, and onboarding metadata.">
            <FormGrid fields={firmFields} columns={3} />
          </Panel>
        }
        right={
          <div className="space-y-6">
            <InfoAside
              accent={accent}
              title="System Actions"
              items={[
                'Generate firm credentials and notify the firm owner.',
                'Mark phone verification as pending OTP confirmation.',
                'Attach subscription plan, referral owner, and onboarding notes.',
              ]}
            />
            <Panel title="Actions" subtitle="Mock workflow buttons">
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl bg-[#0e2340] px-4 py-2.5 text-sm font-semibold text-white">Create Firm</button>
                <button className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700">Save Draft</button>
                <button className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700">Cancel</button>
              </div>
            </Panel>
          </div>
        }
      />
    </div>
  );
}

export function FirmDetailPage({
  accent,
  title,
  limited,
}: AccentProps & { title: string; limited?: boolean }) {
  const details = limited
    ? [
      { label: 'Firm Name', value: 'Legal Experts LLP' },
      { label: 'Owner', value: 'Arjun Sharma' },
      { label: 'Plan', value: 'Growth' },
      { label: 'Renewal', value: '18 Apr 2026' },
      { label: 'Last Activity', value: 'Case sync completed yesterday' },
      { label: 'Partner Notes', value: 'Awaiting branch expansion quote' },
    ]
    : [
      { label: 'Firm Name', value: 'Chen & Associates' },
      { label: 'Registration Number', value: 'BC/1842/2010' },
      { label: 'Address', value: 'Fort, Mumbai, Maharashtra' },
      { label: 'Phone', value: '+91 98XXXXXX45' },
      { label: 'Total Cases', value: '142' },
      { label: 'Total Users', value: '12' },
      { label: 'Pending Bills', value: 'Rs. 82,000' },
      { label: 'Paid Bills', value: 'Rs. 4,52,000' },
    ];

  return (
    <div className="space-y-8">
      <PageSection
        eyebrow={limited ? 'Assigned Firm' : 'Firm Profile'}
        title={title}
        description={limited ? 'Basic firm overview, contact details, plan information, and partner notes.' : 'Platform-owned firm profile with registration, billing, login history, and onboarding context.'}
      />
      <MetricGrid
        accent={accent}
        metrics={
          limited
            ? [
              { label: 'Plan Health', value: 'Stable', hint: 'No renewal risk this month' },
              { label: 'Open Notes', value: '3', hint: 'Internal relationship comments' },
              { label: 'Support Requests', value: '2', hint: 'Awaiting response' },
              { label: 'Recent Logins', value: '17', hint: 'Past 7 days' },
            ]
            : [
              { label: 'Sign-Ups', value: '34', hint: 'Across all users' },
              { label: 'Login Events', value: '264', hint: 'Past 30 days' },
              { label: 'Open Invoices', value: '5', hint: '2 overdue' },
              { label: 'Active Cases', value: '45', hint: '82 disposed, 15 closed' },
            ]
        }
      />
      <SplitPanels
        left={<Panel title="Overview" subtitle="Core firm details and controls"><DetailList items={details} columns={2} /></Panel>}
        right={<InfoAside accent={accent} title="Notes" items={limited ? ['Restricted to overview, contacts, and plan info.', 'No access to cases, documents, or internal staff detail.'] : ['Firm owner cannot delete these records from their account.', 'Suspension, blocking, and audit review remain platform-controlled.']} />}
      />
    </div>
  );
}

export function PartnerOrSalesDetailPage({
  accent,
  title,
  entity,
}: AccentProps & { title: string; entity: 'partner' | 'sales' }) {
  const detailItems = entity === 'partner'
    ? [
      { label: 'Name', value: 'Anita Khanna' },
      { label: 'Assigned Firms', value: '18' },
      { label: 'Renewals This Month', value: '6' },
      { label: 'Role Scope', value: 'Onboarding and relationship management' },
    ]
    : [
      { label: 'Name', value: 'Rohan Sethi' },
      { label: 'Territory', value: 'Mumbai and Pune' },
      { label: 'Referrals', value: '12 active leads' },
      { label: 'Conversion Rate', value: '31%' },
    ];

  return (
    <div className="space-y-8">
      <PageSection
        eyebrow={entity === 'partner' ? 'Partner Manager' : 'Sales Person'}
        title={title}
        description={entity === 'partner' ? 'Platform-level user with limited access to firm onboarding and relationship status.' : 'Referral and sales ownership profile for platform growth tracking.'}
      />
      <SplitPanels
        left={<Panel title="Overview" subtitle="Current workload and ownership metadata"><DetailList items={detailItems} columns={2} /></Panel>}
        right={<InfoAside accent={accent} title="Internal Workflow" items={entity === 'partner' ? ['Can create firms and assign plan context.', 'Cannot suspend firms or view internal case data.'] : ['Tracks referral source, lead notes, and conversion state.', 'Operational access remains limited to commercial context only.']} />}
      />
    </div>
  );
}

export function BillingHubPage({
  accent,
  title,
  description,
  viewBase,
}: AccentProps & { title: string; description: string; viewBase?: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Billing" title={title} description={description} />
      <MetricGrid accent={accent} metrics={invoiceRows} />
      <SplitPanels
        left={
          <Panel title="Invoice Pipeline" subtitle="Open invoices, remittances, and escalation status.">
            <DataTable
              columns={[
                { key: 'invoice', label: 'Invoice' },
                { key: 'owner', label: 'Account' },
                { key: 'amount', label: 'Amount' },
                { key: 'status', label: 'Status' },
                { key: 'due', label: 'Due Date' },
              ]}
              rows={[
                { invoice: 'INV-2041', owner: 'Chen & Associates', amount: 'Rs. 84,000', status: 'Pending', due: '31 Mar 2026', viewHref: viewBase ? `${viewBase}/2041` : undefined },
                { invoice: 'INV-2042', owner: 'Torres Law Group', amount: 'Rs. 1,40,000', status: 'Paid', due: '25 Mar 2026', viewHref: viewBase ? `${viewBase}/2042` : undefined },
                { invoice: 'INV-2043', owner: 'Davis Legal', amount: 'Rs. 32,000', status: 'Overdue', due: '18 Mar 2026', viewHref: viewBase ? `${viewBase}/2043` : undefined },
              ]}
            />
          </Panel>
        }
        right={<InfoAside accent={accent} title="Payment Controls" items={['Track pending and paid bills side by side.', 'Flag overdue balances for follow-up and escalation.', 'Reserve space for invoice PDF, gateway, and receipt integration later.']} />}
      />
    </div>
  );
}

export function SettingsPageTemplate({
  accent,
  title,
  description,
}: AccentProps & { title: string; description: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Settings" title={title} description={description} />
      <SplitPanels
        left={
          <Panel title="Profile and Verification" subtitle="Core identity, contact, and verification placeholders.">
            <FormGrid
              fields={[
                { label: 'Full Name', placeholder: 'Sarah Chen' },
                { label: 'Email Address', placeholder: 'owner@firm.com', type: 'email' },
                { label: 'Phone Number', placeholder: '+91 98XXXXXX45' },
                { label: 'Password', placeholder: '********', type: 'password' },
                { label: 'Verification Notes', placeholder: 'Email verified. Phone OTP pending refresh.', type: 'textarea', wide: true },
              ]}
            />
          </Panel>
        }
        right={<InfoAside accent={accent} title="Preference Areas" items={['Identity and verification', 'Notification and reminder preferences', 'Access control visibility and internal audit reminders']} />}
      />
    </div>
  );
}

export function CasesPage({
  accent,
  title,
  description,
  primaryHref,
  primaryLabel,
  viewBase,
}: AccentProps & { title: string; description: string; primaryHref?: string; primaryLabel?: string; viewBase?: string }) {
  return (
    <div className="space-y-8">
      <PageSection
        title={title}
        description={description}
        actions={primaryHref && primaryLabel ? <ActionLink href={primaryHref} label={primaryLabel} /> : undefined}
      />


      <Panel title="Case Register" subtitle="Search, filter, and review current matters." actions={<SearchBar placeholder="Search case title, number, or advocate..." />}>
        <SimpleTabs tabs={[{ label: 'All Cases', active: true }, { label: 'Running' }, { label: 'Disposed Off' }, { label: 'Closed' }]} />
        <div className="mt-4">
          <DataTable
            columns={[
              { key: 'matter', label: 'Matter' },
              { key: 'number', label: 'Case Number' },
              { key: 'acts', label: 'Acts' },
              { key: 'status', label: 'Status' },
              { key: 'advocate', label: 'Assigned Advocate' },
              { key: 'hearing', label: 'Next Hearing' },
            ]}
            rows={caseRows.map((row, index) => ({ ...row, viewHref: viewBase ? `${viewBase}/${index + 1}` : undefined }))}
          />
        </div>
      </Panel>

    </div>
  );
}

export function CaseCreatePage({ accent }: AccentProps) {
  return (
    <div className="space-y-8">


      <Panel title="Case Creation Form" subtitle="Case registration and matter management schema.">
        <FormGrid fields={caseFormFields} columns={2} />
      </Panel>
    </div>
  );
}

export function CaseDetailPage({
  accent,
  roleTitle,
  allowChat,
  allowApprovals,
  clientMode,
}: AccentProps & { roleTitle: string; allowChat?: boolean; allowApprovals?: boolean; clientMode?: boolean }) {
  return (
    <div className="space-y-8">
      <PageSection
        eyebrow="Case Lifecycle"
        title={`${roleTitle} Case Detail`}
        description={
          clientMode
            ? 'Simplified lifecycle view with progress, documents, hearings, and invoice access.'
            : 'Overview, lifecycle, documents, hearing activity, drafts, and audit history for the selected matter.'
        }
      />
      <MetricGrid
        accent={accent}
        metrics={[
          { label: clientMode ? 'Progress' : 'Current Stage', value: clientMode ? '72%' : 'Evidence' },
          { label: 'Next Hearing', value: '31 Mar 2026', hint: 'Sessions Court - Room 4' },
          { label: 'Documents', value: '24', hint: '4 with version history' },
          { label: 'Open Tasks', value: allowApprovals ? '6' : '4', hint: 'Deadlines and hearing prep' },
        ]}
      />
      <SplitPanels
        left={
          <div className="space-y-6">
            <Panel title="Case Overview" subtitle="Core matter information, assignment, and court context.">
              <DetailList
                items={[
                  { label: 'Case Title', value: 'State vs Mehta' },
                  { label: 'Case Number', value: 'CRL-2026-1042' },
                  { label: 'Status', value: <Badge label="Evidence Stage" tone="warning" /> },
                  { label: 'Assigned Advocate', value: 'Ritika Iyer' },
                  { label: 'Court Details', value: 'Sessions Court, Mumbai' },
                  { label: 'Applicable Acts', value: 'IPC 420, CrPC 154' },
                ]}
                columns={2}
              />
            </Panel>
            <Panel title="Lifecycle Timeline" subtitle="Status transitions and date-wise updates.">
              <Timeline items={caseTimeline} />
            </Panel>
            <Panel title="Document History" subtitle="FIR, petitions, evidence, orders, agreements, and affidavits.">
              <DocumentHistory rows={documentRows} />
            </Panel>
          </div>
        }
        right={
          <div className="space-y-6">
            <Panel title="Hearing and Court Activity" subtitle="Dates, adjournments, orders, and judge remarks.">
              <DetailList items={hearingRows} columns={2} />
            </Panel>
            {!clientMode ? (
              <Panel title="Draft and Petition Tracking" subtitle="Draft submissions, approval status, and revision history.">
                <ActivityFeed
                  items={[
                    { actor: 'Draft v4', action: allowApprovals ? 'awaits admin approval and legal sign-off.' : 'submitted for review.', time: 'Today, 9:10 AM' },
                    { actor: 'Petition Tracker', action: 'shows 2 revisions after court objections.', time: 'Yesterday, 6:30 PM' },
                  ]}
                />
              </Panel>
            ) : null}
            <Panel title={clientMode ? 'Progress Notes' : 'Internal Activity Feed'} subtitle={clientMode ? 'Latest visible updates shared with the client.' : 'Audit trail of activity, logins, and internal tracking.'}>
              <ActivityFeed items={activityRows} />
            </Panel>
            {allowChat ? <InfoAside accent={accent} title="Communication" items={['Direct client messaging is enabled for this role.', 'Message thread supports status follow-ups and hearing reminders.']} /> : null}
          </div>
        }
      />
    </div>
  );
}

export function TeamPage({ accent, viewBase }: AccentProps & { viewBase?: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Team Management" title="Firm Team Directory" description="Create admins, advocates, and paralegals with role-aware access and workload visibility." actions={<ActionLink href="/super-admin/team/new" label="Add Team Member" />} />
      <MetricGrid accent={accent} metrics={[{ label: 'Team Members', value: '12' }, { label: 'Advocates', value: '6' }, { label: 'Paralegals', value: '3' }, { label: 'Admins', value: '3' }]} />
      <Panel title="Current Team" subtitle="Role, workload, and access status">
        <DataTable
          columns={[
            { key: 'name', label: 'Member' },
            { key: 'role', label: 'Role' },
            { key: 'practice', label: 'Practice Area' },
            { key: 'cases', label: 'Cases' },
            { key: 'status', label: 'Status' },
          ]}
          rows={[
            { name: 'Ritika Iyer', role: 'Advocate', practice: 'Criminal', cases: '18', status: 'Active', viewHref: viewBase ? `${viewBase}/1` : undefined },
            { name: 'S. Nair', role: 'Paralegal', practice: 'Litigation Support', cases: '11', status: 'Active', viewHref: viewBase ? `${viewBase}/2` : undefined },
            { name: 'A. Menon', role: 'Admin', practice: 'Operations', cases: 'All access', status: 'Active', viewHref: viewBase ? `${viewBase}/3` : undefined },
          ]}
        />
      </Panel>
    </div>
  );
}

export function TeamMemberFormPage({
  accent,
  detail,
  title,
  description,
}: AccentProps & { detail?: boolean; title?: string; description?: string }) {
  return (
    <div className="space-y-8">
      <PageSection
        eyebrow="Team"
        title={title ?? (detail ? 'Team Member Profile' : 'Add Team Member')}
        description={description ?? (detail ? 'Role scope, assignment load, and access visibility for an individual user.' : 'Create a new admin, advocate, or paralegal using the same role structure as the current exam app.')}
      />
      <SplitPanels
        left={<Panel title={detail ? 'Member Details' : 'Member Form'} subtitle="Core identity, role, reporting, and practice area."><FormGrid fields={teamFields} /></Panel>}
        right={<InfoAside accent={accent} title="Role Notes" items={['Member type is mandatory in the form.', 'Deletion and suspension remain controlled by firm leadership.', 'Future multi-center mapping is reserved for a later phase.']} />}
      />
    </div>
  );
}

export function ClientsPage({ accent, viewBase }: AccentProps & { viewBase?: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Client Management" title="Client Directory" description="Register, update, and review client records tied to firm matters." actions={<ActionLink href="/super-admin/clients/new" label="Register Client" />} />
      <MetricGrid accent={accent} metrics={[{ label: 'Total Clients', value: '88' }, { label: 'New This Month', value: '11' }, { label: 'Active Matters', value: '56' }, { label: 'Pending KYC', value: '3' }]} />
      <Panel title="Client Register" subtitle="Current clients, lead matters, and contact status." actions={<SearchBar placeholder="Search clients, phone, or matter..." />}>
        <DataTable
          columns={[
            { key: 'client', label: 'Client' },
            { key: 'matter', label: 'Lead Matter' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status' },
          ]}
          rows={[
            { client: 'Amit Mehta', matter: 'State vs Mehta', phone: '+91 99XXXXXX12', email: 'amit@example.com', status: 'Active', viewHref: viewBase ? `${viewBase}/1` : undefined },
            { client: 'Nisha Kapoor', matter: 'Property Appeal', phone: '+91 98XXXXXX88', email: 'nisha@example.com', status: 'Pending docs', viewHref: viewBase ? `${viewBase}/2` : undefined },
          ]}
        />
      </Panel>
    </div>
  );
}

export function ClientFormPage({ accent, detail }: AccentProps & { detail?: boolean }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Client" title={detail ? 'Client Profile' : 'Register Client'} description={detail ? 'Contact details, linked matters, and notes.' : 'Capture contact information, intake notes, and client preferences.'} />
      <SplitPanels
        left={<Panel title={detail ? 'Client Details' : 'Client Form'} subtitle="Client profile and relationship data."><FormGrid fields={clientFields} /></Panel>}
        right={<InfoAside accent={accent} title="Linked Records" items={['Case links remain attached to the client master record.', 'Email and phone verification remain placeholder states in this phase.', 'Billing and document access derive from linked matters.']} />}
      />
    </div>
  );
}

export function ReportsPage({ accent }: AccentProps) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Reports" title="Reporting Hub" description="Generate firm performance, case status, workload, and billing reports." />
      <div className="grid gap-6 md:grid-cols-2">
        {reportCards.map((card) => (
          <Panel key={card.label} title={card.label} subtitle={card.value}>
            <div className="flex items-center justify-between rounded-xl bg-[#f7f8fa] p-4">
              <p className="text-sm text-gray-600">Mock filter and export controls will live here.</p>
              <button className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">Generate</button>
            </div>
          </Panel>
        ))}
      </div>
      <InfoAside accent={accent} title="Report Inputs" items={['Date range and practice-area filters', 'Assigned advocate or team workload selection', 'Billing status and realization filters']} />
    </div>
  );
}

export function DocumentLibraryPage({ accent, roleTitle, viewBase }: AccentProps & { roleTitle: string; viewBase?: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Documents" title={`${roleTitle} Document Library`} description="Browse document types, version history, and upload ownership." />
      <SplitPanels
        left={<Panel title="Document Register" subtitle="FIR, petitions, evidence, orders, agreements, and affidavits."><DocumentHistory rows={documentRows} viewBase={viewBase} /></Panel>}
        right={<InfoAside accent={accent} title="Library Notes" items={['Each document captures upload date and uploader identity.', 'Version history is visible for review and audit.', 'Document type filters are represented in this mock through grouped rows.']} />}
      />
    </div>
  );
}

export function DocumentDetailPage({ accent, roleTitle }: AccentProps & { roleTitle: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Document Detail" title={`${roleTitle} Document Detail`} description="Review the selected document, version history, upload ownership, and linked matter context." />
      <SplitPanels
        left={
          <Panel title="Document Overview" subtitle="Metadata, version state, and linked case context.">
            <DetailList
              items={[
                { label: 'Document Name', value: 'FIR Copy' },
                { label: 'Type', value: 'FIR' },
                { label: 'Current Version', value: 'v2' },
                { label: 'Uploaded By', value: 'A. Sharma' },
                { label: 'Uploaded On', value: '12 Mar 2026' },
                { label: 'Linked Matter', value: 'State vs Mehta' },
              ]}
              columns={2}
            />
          </Panel>
        }
        right={
          <InfoAside
            accent={accent}
            title="Version Notes"
            items={[
              'Version lineage and uploader history are visible for audit review.',
              'Download, share, and annotation actions can attach here later.',
              'Client routes stay read-only while internal roles can layer review actions.',
            ]}
          />
        }
      />
    </div>
  );
}

export function DraftsPage({ accent, roleTitle, approvalMode, viewBase }: AccentProps & { roleTitle: string; approvalMode?: boolean; viewBase?: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Drafting" title={`${roleTitle} Draft Workspace`} description={approvalMode ? 'Review draft submissions, approval state, and revision history.' : 'Draft petitions and supporting legal documents for assigned matters.'} />
      <SplitPanels
        left={
          <Panel title="Draft Queue" subtitle="Draft status, linked case, and current revision state.">
            <DataTable
              columns={[
                { key: 'draft', label: 'Draft' },
                { key: 'matter', label: 'Matter' },
                { key: 'owner', label: 'Owner' },
                { key: 'status', label: 'Status' },
                { key: 'updated', label: 'Updated' },
              ]}
              rows={[
                { draft: 'Bail Petition v4', matter: 'State vs Mehta', owner: 'Ritika Iyer', status: approvalMode ? 'Awaiting approval' : 'In progress', updated: 'Today', viewHref: viewBase ? `${viewBase}/1` : undefined },
                { draft: 'Evidence Synopsis v2', matter: 'Apex Traders Arbitration', owner: 'S. Nair', status: 'Needs revision', updated: 'Yesterday', viewHref: viewBase ? `${viewBase}/2` : undefined },
              ]}
            />
          </Panel>
        }
        right={<InfoAside accent={accent} title="Draft Controls" items={approvalMode ? ['Approve or return advocate drafts.', 'Track revision history and version lineage.', 'Link draft status to case lifecycle timeline.'] : ['Rich-text editor shell reserved for petition drafting.', 'Final approval remains restricted by role.', 'Draft actions will later connect to document storage and collaboration.']} />}
      />
    </div>
  );
}

export function DraftDetailPage({ accent, roleTitle }: AccentProps & { roleTitle: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Draft Detail" title={`${roleTitle} Draft Detail`} description="Review the selected draft, revision notes, and approval history." />
      <SplitPanels
        left={<Panel title="Draft Summary" subtitle="Current status, linked matter, and revision notes."><ActivityFeed items={activityRows} /></Panel>}
        right={<InfoAside accent={accent} title="Editor Placeholder" items={['Rich-text drafting area will sit here.', 'Version compare and approval history are represented in the activity feed.', 'Linked matter context remains visible beside draft actions.']} />}
      />
    </div>
  );
}

export function InvoicesPage({ accent, roleTitle, viewBase }: AccentProps & { roleTitle: string; viewBase?: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Invoices" title={`${roleTitle} Invoice Center`} description="Review invoice status, payment collection, and follow-up actions." />
      <MetricGrid accent={accent} metrics={invoiceRows} />
      <Panel title="Invoice Register" subtitle="Matter-linked billing records">
        <DataTable
          columns={[
            { key: 'invoice', label: 'Invoice' },
            { key: 'matter', label: 'Matter' },
            { key: 'client', label: 'Client' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
          ]}
          rows={[
            { invoice: 'INV-2041', matter: 'State vs Mehta', client: 'Amit Mehta', amount: 'Rs. 84,000', status: 'Pending', viewHref: viewBase ? `${viewBase}/2041` : undefined },
            { invoice: 'INV-2044', matter: 'Property Appeal', client: 'Nisha Kapoor', amount: 'Rs. 41,000', status: 'Paid', viewHref: viewBase ? `${viewBase}/2044` : undefined },
          ]}
        />
      </Panel>
    </div>
  );
}

export function InvoiceDetailPage({ accent, roleTitle }: AccentProps & { roleTitle: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Invoice Detail" title={`${roleTitle} Invoice Detail`} description="Matter-linked invoice summary, payment state, and reminder history." />
      <SplitPanels
        left={<Panel title="Invoice Overview" subtitle="Amounts, billing type, and payment history."><DetailList items={[{ label: 'Invoice Number', value: 'INV-2041' }, { label: 'Matter', value: 'State vs Mehta' }, { label: 'Billing Type', value: 'Fixed Fee' }, { label: 'Advance Paid', value: 'Rs. 1,00,000' }, { label: 'Pending', value: 'Rs. 84,000' }, { label: 'Status', value: <Badge label="Pending" tone="warning" /> }]} columns={2} /></Panel>}
        right={<InfoAside accent={accent} title="Collection Notes" items={['Reminder history and payment follow-ups live here.', 'Later integration point for payment receipts and gateway callbacks.', 'Client-facing status remains simplified on client routes.']} />}
      />
    </div>
  );
}

export function MessagingPage({ accent, roleTitle, clientVisible }: AccentProps & { roleTitle: string; clientVisible?: boolean }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Messaging" title={`${roleTitle} Messaging`} description={clientVisible ? 'Simplified message thread for secure client communication.' : 'Internal and client messaging shell for case coordination.'} />
      <SplitPanels
        left={<Panel title="Conversation List" subtitle="Recent case-linked threads."><ActivityFeed items={[{ actor: 'Amit Mehta', action: 'asked for the next hearing update.', time: 'Today, 10:30 AM' }, { actor: 'Ritika Iyer', action: 'shared a draft review request with admin.', time: 'Yesterday, 6:00 PM' }]} /></Panel>}
        right={<InfoAside accent={accent} title="Message Panel" items={clientVisible ? ['Client messaging stays limited to approved channels.', 'No direct case edits from this screen.'] : ['Chat-like interface placeholder for matter-linked conversations.', 'Attachments, templates, and escalation states can be layered in later.']} />}
      />
    </div>
  );
}

export function CalendarPage({ accent, roleTitle }: AccentProps & { roleTitle: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="Calendar" title={`${roleTitle} Calendar and Deadlines`} description="Track hearings, filing deadlines, internal tasks, and reminder windows." />
      <MetricGrid accent={accent} metrics={[{ label: 'Hearings This Week', value: '3' }, { label: 'Deadlines', value: '7' }, { label: 'Same-Day Alerts', value: '2' }, { label: 'Overdue Items', value: '1' }]} />
      <SplitPanels
        left={<Panel title="Upcoming Schedule" subtitle="Daily, weekly, and monthly agenda placeholders."><ActivityFeed items={[{ actor: '31 Mar 2026', action: 'Hearing: State vs Mehta at Sessions Court.', time: '10:30 AM' }, { actor: '02 Apr 2026', action: 'Deadline: Evidence synopsis filing.', time: '5:00 PM' }, { actor: '04 Apr 2026', action: 'Internal prep: witness brief review.', time: '2:30 PM' }]} /></Panel>}
        right={<InfoAside accent={accent} title="Reminder Rules" items={['7-day, 3-day, 1-day, same-day, and overdue alerts.', 'Escalation to admin reserved for critical missed deadlines.', 'eCourts sync remains supportive only; local records stay source of truth.']} />}
      />
    </div>
  );
}

export function NotFoundPage({
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
  return <RecoveryCard title={title} body={body} href={href} label={label} />;
}

export const roleIcons = {
  platform: Building2,
  cases: Briefcase,
  documents: FileText,
  billing: CreditCard,
  reports: Activity,
  drafting: PenTool,
  messages: MessageSquare,
  calendar: Calendar,
  team: Users,
  settings: ShieldCheck,
  court: Gavel,
  tasks: CheckSquare,
};
