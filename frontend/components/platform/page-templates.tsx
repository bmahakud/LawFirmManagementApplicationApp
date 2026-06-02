'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
  UserCheck,
  Link2,
  Copy,
  X,
  Loader2,
  ChevronLeft,
  ExternalLink,
  Download,
  PlusCircle,
  Plus,
  Save,
  ChevronDown,
  AlertCircle,
  Eye,
  Search,
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
  PasswordInput,
  AadharInput,
  PANInput,
  PhoneInput,
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
import { customFetch } from '@/lib/fetch';
import DocumentManager from '@/components/platform/DocumentManager';
import DocumentViewer from '@/components/platform/DocumentViewer';
import { API, API_BASE_URL } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Country, State, City } from 'country-state-city';
import { useTopbarTitle } from '@/components/platform/TopbarContext';
import { toast } from 'react-hot-toast';

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "UAE", "Singapore", "Other"
];

export const MAJOR_INDIAN_CITIES = [
  "Bhubaneswar", "Cuttack", "Mumbai", "Delhi", "Bangalore", "Hyderabad",
  "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam"
];

const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

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

type TableRow = Record<string, React.ReactNode | string | undefined> & {
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
    <Panel title={title}>
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

export function ProfilePageTemplate({
  accent,
  title,
  description,
}: AccentProps & { title: string; description: string }) {
  return (
    <div className="space-y-8">
      <PageSection eyebrow="User Profile" title={title} description={description} />
      <ProfileInformationPanel accent={accent} />
    </div>
  );
}

export function SettingsPageTemplate({
  accent,
  title,
  description,
  children,
  hideRightPanel,
  rightPanel,
}: AccentProps & { title: string; description: string; children?: React.ReactNode; hideRightPanel?: boolean; rightPanel?: React.ReactNode }) {
  const leftContent = (
    <div className="space-y-8">
      <ChangePasswordPanel accent={accent} />
      {children}
    </div>
  );

  return (
    <div className="space-y-8">
      <PageSection eyebrow="Account Settings" title={title} description={description} />
      {hideRightPanel ? (
        <div className="w-full">{leftContent}</div>
      ) : (
        <SplitPanels
          left={leftContent}
          right={rightPanel !== undefined ? rightPanel : <InfoAside accent={accent} title="Security" items={['Change your account password', 'Enforce robust authentication standards']} />}
        />
      )}
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
  filterByAssignedAdvocate,
}: AccentProps & { title: string; description: string; primaryHref?: string; primaryLabel?: string; viewBase?: string; filterByAssignedAdvocate?: boolean }) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        let url = API.CASES.LIST;

        // If filtering by assigned advocate, add query parameter
        if (filterByAssignedAdvocate) {
          url = `${url}?assigned_to_me=true`;
        }

        const response = await customFetch(url);
        const data = await response.json();

        // Handle both paginated and non-paginated responses
        const casesList = Array.isArray(data) ? data : (data.results || []);
        setCases(casesList);
      } catch (err: any) {
        setError(err.message || 'Failed to load cases');
        console.error('Error fetching cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [filterByAssignedAdvocate]);

  const caseRows = cases.map((c) => ({
    matter: c.case_title || 'Untitled Case',
    number: c.case_number || 'N/A',
    acts: c.acts_sections || 'N/A',
    status: c.status || 'N/A',
    advocate: c.assigned_advocate_name || 'Unassigned',
    hearing: c.next_hearing_date || 'Not scheduled',
    viewHref: viewBase ? `${viewBase}/${c.id}` : undefined,
  }));

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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="ml-3 text-sm text-gray-400">Loading cases...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : caseRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-medium">No cases assigned yet</p>
              <p className="text-xs text-gray-400 mt-1">Cases will appear here once assigned to you</p>
            </div>
          ) : (
            <DataTable
              columns={[
                { key: 'matter', label: 'Matter' },
                { key: 'number', label: 'Case Number' },
                { key: 'acts', label: 'Acts' },
                { key: 'status', label: 'Status' },
                { key: 'advocate', label: 'Assigned Advocate' },
                { key: 'hearing', label: 'Next Hearing' },
              ]}
              rows={caseRows}
            />
          )}
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

export function TeamPage({ accent, viewBase, role }: AccentProps & { viewBase?: string; role?: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showJoinLinkModal, setShowJoinLinkModal] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [joinLink, setJoinLink] = useState<any>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        let url = API.USERS.LIST;
        const params = new URLSearchParams();

        if (debouncedSearch) params.set('search', debouncedSearch);
        if (role) params.set('user_type', role);

        if (params.toString()) {
          url = `${url}?${params.toString()}`;
        }

        const response = await customFetch(url);
        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || 'Failed to fetch users');

        setUsers(data.results || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [role, debouncedSearch]);

  const handleCreateJoinLink = async () => {
    if (!role) return;

    try {
      setCreatingLink(true);
      const payload = {
        user_type: role,
        max_uses: 0,
        expires_at: null
      };

      const response = await customFetch(API.JOIN_LINKS.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setJoinLink(data);
        setShowJoinLinkModal(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create link');
      }
    } catch (err: any) {
      console.error('Error creating link:', err);
      toast.error('Failed to create join link');
    } finally {
      setCreatingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (!joinLink) return;
    const fullUrl = `${window.location.origin}/join/${joinLink.id}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  const rows = users.map((u, i) => {
    // Find branch from memberships
    const activeMembership = u.available_firms?.find((m: any) => m.is_active || m.branch_name);
    const branchName = activeMembership?.branch_name || 'N/A';

    // Format Display Identity
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
    const initials = `${(u.first_name || u.username || '').charAt(0)}${(u.last_name || '').charAt(0)}`.toUpperCase() || 'U';

    let avatarUrl = null;
    if (u.profile_image) {
      avatarUrl = u.profile_image.startsWith('http') ? u.profile_image : `${API_BASE_URL}${u.profile_image}`;
    }

    return {
      name: (
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden border border-gray-100 bg-white">
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#984c1f] text-[11px] font-bold shrink-0 uppercase tracking-widest">
              {initials}
            </div>
          )}
          <span className="font-semibold text-gray-800 truncate">{fullName}</span>
        </div>
      ),
      role: u.user_type,
      practice: u.practice_area || 'N/A',
      firm: u.firm_name || 'N/A',
      branch: branchName,
      cases: '0',
      status: u.is_active ? 'Active' : 'Inactive',
      viewHref: viewBase ? `${viewBase}/${u.id}` : undefined,
    };
  });

  const metrics = [
    { label: 'Total Members', value: users.length.toString() },
    { label: 'Active', value: users.filter(u => u.is_active).length.toString() },
    { label: 'Inactive', value: users.filter(u => !u.is_active).length.toString() },
    { label: 'Pending', value: '0' },
  ];

  return (
    <div className="space-y-8">
      <PageSection
        title={`${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Firm'} Team Directory`}
        description="Create and manage your team members with role-aware access and workload visibility."
        actions={
          <div className="flex gap-3">
            <ActionLink href={`${viewBase}/new`} label={`Add ${role || 'Member'}`} />
            {role !== 'super_admin' && role !== 'partner_manager' && (
              <button
                onClick={handleCreateJoinLink}
                disabled={creatingLink}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Join with Link
                  </>
                )}
              </button>
            )}
          </div>
        }
      />
      <MetricGrid accent={accent} metrics={metrics} />
      <Panel
        title="Current Team"
        actions={
          <SearchBar
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-4 text-sm text-gray-400">Loading team data...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Member' },
              { key: 'role', label: 'Role' },
              ...(role === 'super_admin'
                ? [{ key: 'firm', label: 'Associated Law Firm' }]
                : role === 'partner_manager'
                  ? []
                  : role === 'admin'
                    ? [{ key: 'branch', label: 'Assigned Branch' }]
                    : [{ key: 'practice', label: 'Practice Area' }]
              ),
              { key: 'cases', label: 'Cases' },
              { key: 'status', label: 'Status' },
            ]}
            rows={rows}
          />
        )}
      </Panel>

      {showJoinLinkModal && joinLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Join Link Created!</h2>
              <button onClick={() => setShowJoinLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#4a1c40]/5 rounded-xl p-4 border border-[#4a1c40]/10">
                <p className="text-sm font-semibold text-[#4a1c40] mb-2">Share this link:</p>
                <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                  <p className="text-sm text-gray-600 break-all font-mono">{`${window.location.origin}/join/${joinLink.id}`}</p>
                </div>
                <button onClick={copyLinkToClipboard} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#4a1c40] text-white rounded-lg hover:bg-[#3a1530] transition-colors font-semibold">
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">How to use:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy the link above</li>
                  <li>Share it via email, WhatsApp, or SMS</li>
                  <li>New {role} fills in their details</li>
                  <li>They join your firm automatically</li>
                </ol>
              </div>
              <button onClick={() => setShowJoinLinkModal(false)} className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserDetailPage({ accent, userId }: AccentProps & { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [profileFile, setProfileFile] = useState<File | null | 'REMOVE'>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.USERS.DETAIL(userId));
        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || 'Failed to fetch user details');

        setUser(data);
        setProfilePreview(data.profile_image ? (data.profile_image.startsWith('http') ? data.profile_image : `${API_BASE_URL}${data.profile_image}`) : null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    // Identify current viewer
    const details = localStorage.getItem('user_details');
    if (details) {
      try { setViewer(JSON.parse(details)); } catch (e) { console.error('Error parsing viewer details:', e); }
    }
  }, [userId]);

  const [branches, setBranches] = useState<any[]>([]);
  useEffect(() => {
    if (user?.user_type === 'admin' || user?.user_type === 'client') {
      customFetch(API.FIRMS.BRANCHES.LIST)
        .then(res => res.json())
        .then(data => {
          if (data.results) setBranches(data.results);
          else if (Array.isArray(data)) setBranches(data);
        })
        .catch(err => console.error('Failed to fetch branches:', err));
    }
  }, [user?.user_type]);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Access Control: Platform Owner cannot edit Super Admin
  const canEdit = !(viewer?.user_type === 'platform_owner' && user?.user_type === 'super_admin');

  // Push user's full name into the topbar dynamically
  const fullName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : '';
  const userTypeLabel = user?.user_type
    ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)
    : 'User';
  useTopbarTitle(fullName, fullName ? `${userTypeLabel} Profile` : '');

  useEffect(() => {
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        address_line_1: user.address_line_1 || '',
        address_line_2: user.address_line_2 || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        postal_code: user.postal_code || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        aadhar_number: user.aadhar_number || '',
        pan_number: user.pan_number || '',
        bar_council_registration: user.bar_council_registration || '',
        bar_council_state: user.bar_council_state || '',
        is_active: user.is_active ?? true,
        branch: user.available_firms?.[0]?.branch || '',
      });
    }
  }, [user, isEditing]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = { ...editData };

      // Payload cleaning for backend compatibility
      if (payload.aadhar_number) {
        payload.aadhar_number = payload.aadhar_number.replace(/\s/g, '');
      }
      if (payload.phone_number) {
        payload.phone_number = payload.phone_number.replace(/\D/g, '');
      }
      if (!payload.branch) {
        payload.branch = null;
      }

      let response;
      if (profileFile instanceof File) {
        const fData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== null && val !== undefined && val !== '') {
            fData.append(key, String(val));
          }
        });
        fData.append('profile_image', profileFile);
        response = await customFetch(API.USERS.DETAIL(userId), {
          method: 'PATCH',
          body: fData,
        });
      } else {
        const finalPayload = profileFile === 'REMOVE' ? { ...payload, profile_image: null } : payload;
        response = await customFetch(API.USERS.DETAIL(userId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.detail || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      setProfileFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => setEditData((p: any) => ({ ...p, [key]: value }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-400">Loading user profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-12 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
        <p className="text-sm font-medium">Error: {error || 'User not found'}</p>
      </div>
    );
  }

  const profileItems = [
    { label: 'Full Name', value: <span className="text-black font-semibold">{user.first_name} {user.last_name}</span> },
    { label: 'Username', value: <span className="text-black font-semibold">{user.username}</span> },
    { label: 'Email', value: <span className="text-black font-semibold">{user.email}</span> },
    { label: 'Phone', value: <span className="text-black font-semibold">{user.phone_number || '--'}</span> },
    { label: 'User Type', value: <Badge label={user.user_type} tone="info" /> },
    { label: 'Firm Name', value: <span className="text-black font-semibold">{user.firm_name || 'N/A'}</span> },
    { label: 'Assigned Branch', value: <span className="text-black font-semibold">{user.available_firms?.[0]?.branch_name || 'N/A'}</span> },
    { label: 'Gender', value: <span className="text-black font-semibold">{user.gender === 'M' ? 'Male' : user.gender === 'F' ? 'Female' : user.gender === 'O' ? 'Other' : '--'}</span> },
    { label: 'Date of Birth', value: <span className="text-black font-semibold">{user.date_of_birth || '--'}</span> },
  ];

  const addressItems = [
    { label: 'Address Line 1', value: <span className="text-black font-semibold">{user.address_line_1 || '--'}</span> },
    { label: 'Address Line 2', value: <span className="text-black font-semibold">{user.address_line_2 || '--'}</span> },
    { label: 'City', value: <span className="text-black font-semibold">{user.city || '--'}</span> },
    { label: 'State', value: <span className="text-black font-semibold">{user.state || '--'}</span> },
    { label: 'Country', value: <span className="text-black font-semibold">{user.country || '--'}</span> },
    { label: 'Postal Code', value: <span className="text-black font-semibold">{user.postal_code || '--'}</span> },
  ];

  const verificationItems = [
    { label: 'Email Verified', value: <Badge label={user.is_email_verified ? 'Verified' : 'Pending'} tone={user.is_email_verified ? 'success' : 'warning'} /> },
    { label: 'Phone Verified', value: <Badge label={user.is_phone_verified ? 'Verified' : 'Pending'} tone={user.is_phone_verified ? 'success' : 'warning'} /> },
    { label: 'Document Verified', value: <Badge label={user.is_document_verified ? 'Verified' : 'Pending'} tone={user.is_document_verified ? 'success' : 'warning'} /> },
    { label: 'Account Status', value: <Badge label={user.is_active ? 'Active' : 'Inactive'} tone={user.is_active ? 'success' : 'danger'} /> },
  ];

  const professionalItems = [
    { label: 'Aadhar Number', value: <span className="text-black font-semibold">{user.aadhar_number || '--'}</span> },
    { label: 'PAN Number', value: <span className="text-black font-semibold">{user.pan_number || '--'}</span> },
    { label: 'Bar Council Reg', value: <span className="text-black font-semibold">{user.bar_council_registration || '--'}</span> },
    { label: 'Bar Council State', value: <span className="text-black font-semibold">{user.bar_council_state || '--'}</span> },
  ];

  return (
    <div className="space-y-8">
      <PageSection
        eyebrow="User Profile"
        title={`${user.first_name} ${user.last_name}`}
        description={`Full breakdown of account details, firm association, and verified credentials for ${user.user_type}.`}
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0e2340] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a3a5c] shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          ) : (
            canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <PenTool className="h-4 w-4" /> Edit Profile
              </button>
            )
          )
        }
      />

      <SplitPanels
        left={
          <div className="space-y-6">
            <Panel title="Identity & Contact" subtitle="Basic personal and role information.">
              {isEditing ? (
                <>
                  <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100 mt-2">
                    <div className="relative group w-20 h-20 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfileFile(file);
                          setProfilePreview(URL.createObjectURL(file));
                        }
                      }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      {profilePreview ? (
                        <>
                          <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-[10px] uppercase font-bold tracking-wider">Change</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider group-hover:text-gray-500">Photo</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Profile Image</h3>
                      <p className="text-xs text-gray-500 mt-1 mb-2">Upload a square image (max 5MB).</p>
                      {profilePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileFile('REMOVE');
                            setProfilePreview(null);
                          }}
                          className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">First Name</label>
                      <input value={editData.first_name} onChange={e => updateField('first_name', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Last Name</label>
                      <input value={editData.last_name} onChange={e => updateField('last_name', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Phone</label>
                      <PhoneInput
                        value={editData.phone_number}
                        onChange={v => updateField('phone_number', v)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Gender</label>
                      <select value={editData.gender} onChange={e => updateField('gender', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none">
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Date of Birth</label>
                      <input
                        type="date"
                        value={editData.date_of_birth || ''}
                        onChange={e => updateField('date_of_birth', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                      />
                    </div>
                    {(user.user_type === 'admin' || user.user_type === 'client') && branches.length > 0 && (
                      <div className="md:col-span-2 pt-2 border-t border-gray-100">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Assigned Branch {user.user_type === 'admin' && <span className="text-red-500">*</span>}</label>
                        <select
                          value={editData.branch}
                          onChange={e => updateField('branch', e.target.value)}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none"
                        >
                          <option value="">Select Branch</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {profilePreview && (
                    <div className="shrink-0 w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                      <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 w-full">
                    <DetailList items={profileItems} columns={2} />
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Location Details" subtitle="Full residential or office address.">
              {isEditing ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Address Line 1</label>
                    <input value={editData.address_line_1} onChange={e => updateField('address_line_1', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors" />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Address Line 2</label>
                    <input value={editData.address_line_2} onChange={e => updateField('address_line_2', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Country</label>
                    <div className="relative group">
                      <select
                        value={editData.country}
                        onChange={e => {
                          updateField('country', e.target.value);
                          updateField('state', '');
                          updateField('city', '');
                        }}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none appearance-none focus:border-[#0e2340] transition-colors"
                      >
                        <option value="">Select Country</option>
                        {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">State</label>
                    <div className="relative group">
                      <select
                        value={editData.state}
                        disabled={!editData.country}
                        onChange={e => {
                          updateField('state', e.target.value);
                          updateField('city', '');
                        }}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none appearance-none disabled:opacity-50 focus:border-[#0e2340] transition-colors"
                      >
                        <option value="">Select State</option>
                        {editData.country && State.getStatesOfCountry(editData.country).map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">City</label>
                    <div className="relative group">
                      {editData.country && editData.state && City.getCitiesOfState(editData.country, editData.state).length > 0 ? (
                        <>
                          <select
                            value={editData.city}
                            onChange={e => updateField('city', e.target.value)}
                            className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none appearance-none focus:border-[#0e2340] transition-colors"
                          >
                            <option value="">Select City</option>
                            {City.getCitiesOfState(editData.country, editData.state).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                        </>
                      ) : (
                        <input
                          value={editData.city}
                          onChange={e => updateField('city', e.target.value)}
                          placeholder="Type city..."
                          className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors shadow-sm shadow-[#0e2340]/[0.02]"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Postal Code</label>
                    <input value={editData.postal_code} onChange={e => updateField('postal_code', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 400001" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors shadow-sm shadow-[#0e2340]/[0.02]" />
                  </div>
                </div>
              ) : (
                <DetailList items={addressItems} columns={3} />
              )}
            </Panel>

            <Panel title="Identification & Professional" subtitle="Identity numbers and legal registration data.">
              {isEditing ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Aadhar Number</label>
                    <AadharInput
                      value={editData.aadhar_number}
                      onChange={v => updateField('aadhar_number', v)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">PAN Number</label>
                    <PANInput
                      value={editData.pan_number}
                      onChange={v => updateField('pan_number', v)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Bar Council Reg</label>
                    <input value={editData.bar_council_registration} onChange={e => updateField('bar_council_registration', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Bar Council State</label>
                    <select value={editData.bar_council_state} onChange={e => updateField('bar_council_state', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <DetailList items={professionalItems} columns={2} />
              )}
            </Panel>
          </div>
        }
        right={
          <div className="space-y-6">
            <Panel title="Verification Status" subtitle="System-level trust indicators.">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Account Active</span>
                    <button
                      onClick={() => updateField('is_active', !editData.is_active)}
                      className={classNames(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                        editData.is_active ? "bg-[#0e2340]" : "bg-gray-200"
                      )}
                    >
                      <span className={classNames(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        editData.is_active ? "translate-x-5" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Deactivating an account will prevent the user from logging in until reactivated.</p>
                </div>
              ) : (
                <DetailList items={verificationItems} columns={1} />
              )}
            </Panel>

            <Panel title="System Metadata" subtitle="Audit trail and security info.">
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider">Account Created</span>
                  <span className="text-gray-600 font-bold">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider">Last Updated</span>
                  <span className="text-gray-600 font-bold">{new Date(user.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider">Password Set</span>
                  <span className="text-gray-600 font-bold">{user.password_set ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </Panel>

            <InfoAside
              accent={accent}
              title="Profile Integrity"
              items={[
                'Verify all credentials before document assignment.',
                'Role-specific permissions are synced globally.',
                'Audit logs capture all profile modifications.'
              ]}
            />
            {error && <p className="text-xs font-semibold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
          </div>
        }
      />
    </div>
  );
}

export function TeamMemberFormPage({
  accent,
  detail,
  title,
  description,
  fixedRole,
}: AccentProps & { detail?: boolean; title?: string; description?: string; fixedRole?: string }) {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId || params?.id;

  const [formData, setFormData] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    user_type: fixedRole || 'advocate',
    firm: '',
    date_of_birth: '',
    gender: '',
    aadhar_number: '',
    pan_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    bar_council_registration: '',
    bar_council_state: '',
    is_active: true,
    branch: '',
    existing_user_id: null,
  });
  const [firms, setFirms] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitError, setLimitError] = useState<any>(null);

  useEffect(() => {
    // Always fetch firms so the existing-user "Target Firm" dropdown is populated
    customFetch(API.FIRMS.LIST)
      .then(res => res.json())
      .then(data => {
        if (data.results) setFirms(data.results);
        else if (Array.isArray(data)) setFirms(data);
      })
      .catch(err => console.error('Failed to fetch firms:', err));
  }, []);

  useEffect(() => {
    // If we're creating/editing an admin, fetch branches
    // For Super Admin, /api/branches/ returns branches of their firm
    // For Platform Owner, we might filter by the selected firm later
    if (formData.user_type === 'admin' || formData.user_type === 'client') {
      customFetch(API.FIRMS.BRANCHES.LIST)
        .then(res => res.json())
        .then(data => {
          if (data.results) setBranches(data.results);
          else if (Array.isArray(data)) setBranches(data);
        })
        .catch(err => console.error('Failed to fetch branches:', err));
    }
  }, [formData.user_type]);

  useEffect(() => {
    if (detail && userId) {
      setLoading(true);
      customFetch(API.USERS.DETAIL(userId as string))
        .then(res => res.json())
        .then(data => {
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            password: '',
            user_type: data.user_type || fixedRole || 'advocate',
            firm: data.firm || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            aadhar_number: data.aadhar_number || '',
            pan_number: data.pan_number || '',
            address_line_1: data.address_line_1 || '',
            address_line_2: data.address_line_2 || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || 'India',
            postal_code: data.postal_code || '',
            bar_council_registration: data.bar_council_registration || '',
            bar_council_state: data.bar_council_state || '',
            is_active: data.is_active ?? true,
            branch: data.available_firms?.[0]?.branch || '',
          });
        })
        .catch(err => setError('Failed to load user data'))
        .finally(() => setLoading(false));
    }
  }, [detail, userId]);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState<any>(null);

  const handleLookup = async (type: 'email' | 'phone', value: string) => {
    if (!value || value.length < 5) return;

    // Simple validation before searching
    if (type === 'email' && !value.includes('@')) return;
    if (type === 'phone' && value.length < 10) return;

    setIsLookingUp(true);
    try {
      const q = type === 'email' ? `email=${value}` : `phone=${value}`;
      const res = await customFetch(`/api/users/lookup/?${q}`); // Final fix on URL
      const data = await res.json();

      if (data.found) {
        setExistingUserFound(data);
        // Force a full state update with the found user data
        setFormData((prev: any) => ({
          ...prev,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          user_type: data.user_type || prev.user_type,
          existing_user_id: data.id
        }));
      } else {
        setExistingUserFound(null);
        setFormData((prev: any) => ({ ...prev, existing_user_id: null }));
      }
    } catch (err) {
      console.error('Lookup failed:', err);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Debounced lookup for email - faster response (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && formData.email.includes('@')) {
        handleLookup('email', formData.email);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.email]);

  // Debounced lookup for phone - faster response (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.phone_number && formData.phone_number.length >= 10) {
        handleLookup('phone', formData.phone_number);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.phone_number]);

  const roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Advocate', value: 'advocate' },
    { label: 'Paralegal', value: 'paralegal' },
    { label: 'Client', value: 'client' },
    { label: 'Partner Manager', value: 'partner_manager' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLimitError(null);

    try {
      const payload = { ...formData };

      // Auto-assign first firm for Partner Manager if none selected, as backend requires it
      // for invitation emails and role mapping (preventing 500 error).
      if (payload.user_type === 'partner_manager' && !payload.firm && firms.length > 0) {
        payload.firm = firms[0].id;
      }

      // Perfect Payload Handling: Send null for empty optional fields
      // This prevents the backend (UserFirmRole/UserInvitation) from crashing on empty strings
      if (payload.aadhar_number) {
        payload.aadhar_number = payload.aadhar_number.replace(/\s/g, '');
      }
      if (payload.phone_number) {
        payload.phone_number = payload.phone_number.replace(/\D/g, '');
      }

      if (!payload.firm) payload.firm = null;
      if (!payload.date_of_birth) payload.date_of_birth = null;
      if (!payload.aadhar_number) payload.aadhar_number = null;
      if (!payload.pan_number) payload.pan_number = null;
      if (!payload.gender) payload.gender = "";
      if (!payload.bar_council_registration) payload.bar_council_registration = "";
      if (!payload.bar_council_state) payload.bar_council_state = "";
      if (!payload.branch) payload.branch = null;

      const url = detail && userId ? API.USERS.DETAIL(userId as string) : API.USERS.ADD_USER;
      const method = detail && userId ? 'PATCH' : 'POST';

      const response = await customFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error && data.upgrade_message) {
          setLimitError(data);
          return;
        }
        throw new Error(data.error || data.detail || 'Failed to create user');
      }

      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: any) => setFormData((p: any) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-8">
      <PageSection
        eyebrow="Onboarding"
        title={title ?? (detail ? 'Team Member Profile' : 'Add Team Member')}
        description={description ?? (detail ? 'Role scope, assignment load, and access visibility for an individual user.' : 'Create a new team member with controlled access and full profile initialization.')}
      />
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-sm font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {existingUserFound && (
          <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-5 animate-in fade-in zoom-in duration-500 shadow-sm">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-blue-900">Professional Recognized</h4>
              <p className="text-sm font-semibold text-blue-700/80 mb-3">
                {existingUserFound.first_name} {existingUserFound.last_name} ({existingUserFound.user_type}) is already on AntLegal.
              </p>

              {/* Added Firm Selection for Multi-Firm Admins */}
              <div className="max-w-xs transition-all animate-in fade-in slide-in-from-left-2 duration-700">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-blue-600/60">Target Law Firm</label>
                <div className="relative group">
                  <select
                    value={formData.firm}
                    onChange={e => update('firm', e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border border-blue-200 bg-white px-3 text-xs text-blue-900 font-bold outline-none appearance-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    <option value="">Select firm to add them to...</option>
                    {firms.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.firm_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setExistingUserFound(null);
                setFormData((p: any) => ({ ...p, existing_user_id: null, email: '', phone_number: '', first_name: '', last_name: '' }));
              }}
              className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
            >
              Cancel & New
            </button>
          </div>
        )}

        {limitError && (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900 mb-1">Subscription Limit Reached</h3>
                <p className="text-sm font-medium text-amber-800 mb-4 leading-relaxed">{limitError.error}</p>

                <div className="flex items-center flex-wrap gap-4 text-xs font-semibold text-amber-700 bg-amber-100/50 px-4 py-3 rounded-lg mb-4">
                  <div>Plan: <span className="uppercase font-bold text-amber-900">{limitError.subscription_type}</span></div>
                  <div className="w-1 h-1 bg-amber-300 rounded-full"></div>
                  <div>Limit: <span className="font-bold text-amber-900">{limitError.user_limit || limitError.advocate_limit || limitError.paralegal_limit || limitError.admin_limit || limitError.client_limit || limitError.limit || 'Max Reached'}</span></div>
                  <div className="w-1 h-1 bg-amber-300 rounded-full"></div>
                  <div>Active: <span className="font-bold text-amber-900">{limitError.current_users || limitError.current_advocates || limitError.current_paralegals || limitError.current_admins || limitError.current_clients || limitError.current || 'At Limit'}</span></div>
                </div>

                <p className="text-sm font-medium text-amber-800 mb-4">{limitError.upgrade_message}</p>

                <Link href="/super-admin/finance/subscriptions" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm">
                  Upgrade Subscription
                </Link>
              </div>
            </div>
          </div>
        )}
        <SplitPanels
          left={
            <div className="space-y-6">
              <Panel title="Core Account" subtitle="Basic identity and professional role.">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">First Name</label>
                    <input disabled={!!existingUserFound} value={formData.first_name} onChange={e => update('first_name', e.target.value)} required placeholder="John" className={`h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all ${!!existingUserFound ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'bg-[#f7f8fa]'}`} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Last Name</label>
                    <input disabled={!!existingUserFound} value={formData.last_name} onChange={e => update('last_name', e.target.value)} required placeholder="Doe" className={`h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all ${!!existingUserFound ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'bg-[#f7f8fa]'}`} />
                  </div>
                  <div className="relative">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                    <div className="relative group">
                      <input type="email" value={formData.email} onChange={e => update('email', e.target.value)} required placeholder="john@example.com" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all pr-12" />
                      {isLookingUp && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Phone Number</label>
                    <PhoneInput
                      value={formData.phone_number}
                      onChange={v => update('phone_number', v)}
                    />
                  </div>
                  {!fixedRole && (
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">User Role</label>
                      <select disabled={!!existingUserFound} value={formData.user_type} onChange={e => update('user_type', e.target.value)} className={`h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm text-black font-semibold outline-none appearance-none ${!!existingUserFound ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'bg-[#f7f8fa]'}`}>
                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  )}
                  {((formData.user_type === 'admin' || formData.user_type === 'client') && branches.length > 0) && (
                    <div className="md:col-span-2 pt-2 border-t border-gray-100">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                        Assign Branch {formData.user_type === 'admin' && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={formData.branch}
                        onChange={e => update('branch', e.target.value)}
                        required={formData.user_type === 'admin'}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none appearance-none"
                      >
                        <option value="">{formData.user_type === 'client' ? 'Select a branch (optional)...' : 'Select a branch...'}</option>
                        {branches.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.branch_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Identity & Profile" subtitle="Identity numbers and personal details.">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Gender</label>
                    <select disabled={!!existingUserFound} value={formData.gender} onChange={e => update('gender', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none appearance-none disabled:opacity-70 disabled:cursor-not-allowed">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Date of Birth</label>
                    <input disabled={!!existingUserFound} type="date" value={formData.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none disabled:opacity-70 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Aadhar Number</label>
                    <AadharInput disabled={!!existingUserFound} value={formData.aadhar_number} onChange={v => update('aadhar_number', v)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">PAN Number</label>
                    <input disabled={!!existingUserFound} value={formData.pan_number} onChange={e => update('pan_number', e.target.value)} placeholder="ABCDE1234F" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase" />
                  </div>
                </div>
              </Panel>

              {!existingUserFound && (
                <Panel title="Location & Firm" subtitle="Service region and firm alignment.">
                  <div className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Address Line 1</label>
                        <input value={formData.address_line_1} onChange={e => update('address_line_1', e.target.value)} placeholder="Street name, building" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Address Line 2</label>
                        <input value={formData.address_line_2} onChange={e => update('address_line_2', e.target.value)} placeholder="Locality, landmark" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all" />
                      </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">State</label>
                        <input value={formData.state} onChange={e => update('state', e.target.value)} placeholder="State" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">City</label>
                        <input value={formData.city} onChange={e => update('city', e.target.value)} placeholder="City" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Postal Code</label>
                      <input value={formData.postal_code} onChange={e => update('postal_code', e.target.value)} placeholder="e.g. 400001" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all" />
                    </div>
                    {formData.user_type === 'super_admin' && (
                      <div className="pt-2 border-t border-gray-100">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                          Associated Law Firm <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <select
                            value={formData.firm}
                            onChange={e => update('firm', e.target.value)}
                            required
                            className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none appearance-none focus:border-[#0e2340] transition-colors hover:border-gray-200"
                          >
                            <option value="">Select a firm...</option>
                            {firms.map((f: any) => (
                              <option key={f.id} value={f.id}>{f.firm_name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              )}

              <Panel title="Professional Credentials" subtitle="Legal registration details.">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Bar Registration No.</label>
                    <input value={formData.bar_council_registration} onChange={e => update('bar_council_registration', e.target.value)} placeholder="E.g. WB/123/2023" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Bar Registration State</label>
                    <input value={formData.bar_council_state} onChange={e => update('bar_council_state', e.target.value)} placeholder="E.g. West Bengal" className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-all" />
                  </div>
                </div>
              </Panel>
            </div>
          }
          right={
            <div className="space-y-6">
              {!existingUserFound && (
                <Panel title="Account Security" subtitle={detail ? "Update credentials" : "Onboarding credentials."}>
                  <div className="space-y-4">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                      {detail ? "Change Password (Optional)" : "Temporary Password"}
                    </label>
                    <PasswordInput
                      value={formData.password}
                      onChange={v => update('password', v)}
                      required={!detail && !existingUserFound}
                    />
                  </div>
                  {detail && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Account Active</span>
                      <button
                        type="button"
                        onClick={() => update('is_active', !formData.is_active)}
                        className={classNames(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                          formData.is_active ? "bg-[#0e2340]" : "bg-gray-200"
                        )}
                      >
                        <span className={classNames(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          formData.is_active ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  )}
                </Panel>
              )}

              <Panel title="Actions" subtitle="Finalize onboarding">
                <div className="flex flex-col gap-3">
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#0e2340] px-4 py-3 text-sm font-bold text-white hover:bg-[#1a3a5c] shadow-lg shadow-[#0e2340]/10 transition-all active:scale-[0.98] disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {existingUserFound ? 'Add to Firm' : 'Save Team Member'}
                  </button>
                  <button type="button" onClick={() => router.back()} className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all active:scale-[0.98]">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
                {error && <p className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-red-500 animate-in slide-in-from-top-1">{error}</p>}
              </Panel>
            </div>
          }
        />
      </form>
    </div>
  );
}

export function ClientsPage({ accent, viewBase, role }: AccentProps & { viewBase?: string; role?: string }) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinLinkModal, setShowJoinLinkModal] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [joinLink, setJoinLink] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        let url = API.USERS.LIST;
        const params = new URLSearchParams();

        if (debouncedSearch) params.set('search', debouncedSearch);
        if (role) params.set('user_type', role);

        if (params.toString()) {
          url = `${url}?${params.toString()}`;
        }

        const response = await customFetch(url);
        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || 'Failed to fetch clients');

        setClients(data.results || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [role, debouncedSearch]);

  const handleCreateJoinLink = async () => {
    if (!role) return;

    try {
      setCreatingLink(true);
      const payload = {
        user_type: role,
        max_uses: 0,
        expires_at: null
      };

      const response = await customFetch(API.JOIN_LINKS.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setJoinLink(data);
        setShowJoinLinkModal(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create link');
      }
    } catch (err: any) {
      console.error('Error creating link:', err);
      toast.error('Failed to create join link');
    } finally {
      setCreatingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (!joinLink) return;
    const fullUrl = `${window.location.origin}/join/${joinLink.id}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  const rows = clients.map((u, i) => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
    const initials = `${(u.first_name || u.username || '').charAt(0)}${(u.last_name || '').charAt(0)}`.toUpperCase() || 'C';

    let avatarUrl = null;
    if (u.profile_image) {
      avatarUrl = u.profile_image.startsWith('http') ? u.profile_image : `${API_BASE_URL}${u.profile_image}`;
    }

    return {
      client: (
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden border border-gray-100 bg-white">
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#6366f1] text-[11px] font-bold shrink-0 uppercase tracking-widest">
              {initials}
            </div>
          )}
          <span className="font-semibold text-gray-800 truncate">{fullName}</span>
        </div>
      ),
      matter: 'N/A',
      phone: u.phone_number || '--',
      email: u.email || '--',
      status: u.is_active ? 'Active' : 'Inactive',
      viewHref: viewBase ? `${viewBase}/${u.id}` : undefined,
    };
  });

  return (
    <div className="space-y-8">
      <PageSection
        eyebrow="Client Management"
        title="Client Directory"
        description="Register and manage client records tied to firm matters."
        actions={
          <div className="flex gap-3">
            <ActionLink href={`${viewBase}/new`} label="Register Client" />
            <button
              onClick={handleCreateJoinLink}
              disabled={creatingLink}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingLink ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Join with Link
                </>
              )}
            </button>
          </div>
        }
      />
      <MetricGrid accent={accent} metrics={[{ label: 'Total Clients', value: clients.length.toString() }, { label: 'Active', value: clients.filter(c => c.is_active).length.toString() }, { label: 'Pending Docs', value: '0' }, { label: 'New This Month', value: '0' }]} />
      <Panel title="Client Register" subtitle="Current clients, lead matters, and contact status." actions={<SearchBar placeholder="Search clients, phone, or matter..." value={search} onChange={setSearch} />}>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-4 text-sm text-gray-400">Loading clients...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'client', label: 'Client' },
              { key: 'matter', label: 'Lead Matter' },
              { key: 'phone', label: 'Phone' },
              { key: 'email', label: 'Email' },
              { key: 'status', label: 'Status' },
            ]}
            rows={rows}
          />
        )}
      </Panel>

      {showJoinLinkModal && joinLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Join Link Created!</h2>
              <button onClick={() => setShowJoinLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-[#4a1c40]/5 rounded-xl p-4 border border-[#4a1c40]/10">
                <p className="text-sm font-semibold text-[#4a1c40] mb-2">Share this link:</p>
                <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                  <p className="text-sm text-gray-600 break-all font-mono">{`${window.location.origin}/join/${joinLink.id}`}</p>
                </div>
                <button onClick={copyLinkToClipboard} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#4a1c40] text-white rounded-lg hover:bg-[#3a1530] transition-colors font-semibold">
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">How to use:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Copy the link above</li>
                  <li>Share it via email, WhatsApp, or SMS</li>
                  <li>New {role} fills in their details</li>
                  <li>They join your firm automatically</li>
                </ol>
              </div>
              <button onClick={() => setShowJoinLinkModal(false)} className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
      <PageSection
        eyebrow="Documents"
        title={`${roleTitle} Document Library`}
        description="Personal and professional documents for verification and record keeping."
      />
      <Panel title="My Documents" subtitle="Upload and manage your documents">
        <DocumentManager accent={accent} showUpload={true} viewBase={viewBase} />
      </Panel>
    </div>
  );
}

export function DocumentDetailPage({ accent, roleTitle, documentId }: AccentProps & { roleTitle: string; documentId: string }) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const response = await customFetch(API.DOCUMENTS.DETAIL(documentId));
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to fetch document');
        setDoc(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [documentId]);

  const docTitle = doc?.document_title || 'Document';
  useTopbarTitle(docTitle, docTitle ? 'Document Detail' : '');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-in fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        <p className="mt-4 text-sm text-gray-400 font-medium italic">Retreiving document metadata...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-12 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
        <p className="text-sm font-semibold">Alert: {error || 'Document record not found'}</p>
        <button onClick={() => window.history.back()} className="mt-4 text-sm font-bold text-[#0e2340] hover:underline">
          Return to Library
        </button>
      </div>
    );
  }

  const fileUrl = doc.file_url || doc.document_file;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const filename = doc.document_title || 'document';
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;

      // Trigger the download through the proxy
      window.location.href = proxyUrl;
    } catch (err) {
      console.error('Download failed:', err);
      window.open(fileUrl, '_blank');
    } finally {
      // Keep loading state for a moment to indicate download started
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageSection
        eyebrow="Library Archive"
        title={doc.document_title}
        description={`Detailed record for ${doc.document_type_display || doc.document_type}. Original file is stored securely.`}
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0e2340] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? 'Downloading...' : 'Download Document'}
            </button>
          </div>
        }
      />

      <div className="animate-in fade-in zoom-in-95 duration-500 delay-150">
        <DocumentViewer
          url={fileUrl}
          title={doc.document_title}
        />
      </div>

      <SplitPanels
        left={
          <div className="space-y-6">
            <Panel title="Identity & Classification" subtitle="Core document identifiers and types.">
              <DetailList
                columns={2}
                items={[
                  { label: 'Document Title', value: <span className="font-bold text-gray-900">{doc.document_title}</span> },
                  { label: 'Type Display', value: <span className="font-semibold text-gray-700">{doc.document_type_display}</span> },
                  { label: 'Internal ID', value: <span className="font-mono text-[10px] text-gray-400 uppercase">{doc.id}</span> },
                  { label: 'Category', value: <span className="text-gray-500 italic">{doc.document_category || 'General Content'}</span> },
                  { label: 'Version', value: <Badge label={`v${doc.version || 1}`} tone="info" /> },
                  { label: 'Doc Number', value: <span className="font-semibold text-gray-700">{doc.document_number || '--'}</span> },
                ]}
              />
            </Panel>

            <Panel title="Origin & Lifecycle" subtitle="Creation details and maintenance timestamps.">
              <DetailList
                columns={2}
                items={[
                  { label: 'Uploaded By', value: <span className="font-semibold text-gray-700">{doc.uploaded_by_name}</span> },
                  { label: 'Firm Reference', value: <span className="font-mono text-[10px] text-gray-400">{doc.firm}</span> },
                  { label: 'Upload Date', value: <span className="text-gray-600 font-medium text-xs">{new Date(doc.uploaded_at).toLocaleString()}</span> },
                  { label: 'Last Modified', value: <span className="text-gray-600 font-medium text-xs">{new Date(doc.updated_at).toLocaleString()}</span> },
                  { label: 'Active Status', value: doc.is_deleted ? <Badge label="Deleted" tone="danger" /> : <Badge label="Normal" tone="success" /> },
                ]}
              />
            </Panel>

            {doc.description && (
              <Panel title="Description / Notes" subtitle="Contextual information provided during archive.">
                <div className="bg-[#f7f8fa] rounded-2xl p-5 border border-dashed border-gray-200">
                  <p className="text-sm text-gray-600 italic leading-relaxed">"{doc.description}"</p>
                </div>
              </Panel>
            )}
          </div>
        }
        right={
          <div className="space-y-6">
            <Panel title="Verification Status" subtitle="Audit trails and compliance state.">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#f7f8fa] rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current State</span>
                  <Badge
                    label={(doc.verification_status || 'pending').toUpperCase()}
                    tone={doc.verification_status === 'verified' ? 'success' : doc.verification_status === 'rejected' ? 'danger' : 'warning'}
                  />
                </div>

                <DetailList
                  columns={1}
                  items={[
                    { label: 'Verified By', value: <span className="font-semibold text-gray-700">{doc.verified_by || 'Not Reviewed'}</span> },
                    { label: 'Review Timestamp', value: <span className="text-gray-600 font-medium text-xs">{doc.verified_at ? new Date(doc.verified_at).toLocaleString() : '--'}</span> },
                  ]}
                />

                {doc.verification_notes && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Reviewer Feedback</p>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                      <p className="text-sm text-amber-900 italic leading-relaxed">{doc.verification_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <InfoAside
              accent={accent}
              title="Audit Constraints"
              items={[
                'This metadata record is a read-only historical archive.',
                'Direct file URLs may be session-restricted for data protection.',
                'Deletion records are preserved for compliance audit trails.',
                'Verification status impacts case accessibility and legal standing.',
              ]}
            />
          </div>
        }
      />
    </div>
  );
}

export function DraftsPage({ accent, roleTitle, approvalMode, viewBase }: AccentProps & { roleTitle: string; approvalMode?: boolean; viewBase?: string }) {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [previewCaseId, setPreviewCaseId] = useState<string | null>(null);
  const [previewForms, setPreviewForms] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      // Fetch drafts
      const [draftsRes, casesRes] = await Promise.all([
        customFetch(API.DOCUMENTS.FILLED_COURT_FORMS.LIST),
        customFetch(`${API.CASES.LIST}?assigned_to_me=true`)
      ]);

      const draftsData = await draftsRes.json();
      const draftsList = Array.isArray(draftsData) ? draftsData : (draftsData.results || []);
      setDrafts(draftsList);

      const casesData = await casesRes.json();
      const casesList = Array.isArray(casesData) ? casesData : (casesData.results || []);
      setAllCases(casesList);

      // Auto-select ONLY if nothing is selected yet
      if (casesList.length > 0 && !selectedCaseId) {
        const caseWithDrafts = casesList.find((c: any) => draftsList.some((d: any) => d.case === c.id));
        setSelectedCaseId(String(caseWithDrafts ? caseWithDrafts.id : casesList[0].id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const draftRows = drafts.map((d) => ({
    draft: d.template_name || 'Untitled Draft',
    matter: d.case_number || 'N/A',
    owner: d.created_by_name || 'N/A',
    status: (
      <Badge
        label={d.status_display || d.status}
        tone={
          d.status === 'draft' ? 'default' :
            d.status === 'signed' ? 'success' :
              d.status === 'completed' ? 'info' : 'warning'
        }
      />
    ),
    updated: new Date(d.updated_at).toLocaleDateString(),
    viewHref: viewBase?.includes('paralegal')
      ? `/paralegal/cases/${d.case}?tab=Drafting&formId=${d.id}`
      : `/advocate/cases/${d.case}?tab=Drafting&formId=${d.id}`,
  }));

  const groupedByCase = useMemo(() => {
    const groups: Record<string, any[]> = {};
    drafts.forEach((d) => {
      const caseKey = d.case_number || 'Unknown Case';
      if (!groups[caseKey]) groups[caseKey] = [];
      groups[caseKey].push(d);
    });
    // Sort items within each case by priority/sequence
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const seqA = (a.custom_sequence !== null && a.custom_sequence !== undefined && a.custom_sequence !== 0) ? a.custom_sequence : (a.template_sequence || 0);
        const seqB = (b.custom_sequence !== null && b.custom_sequence !== undefined && b.custom_sequence !== 0) ? b.custom_sequence : (b.template_sequence || 0);

        if (seqA !== seqB) {
          return seqA - seqB;
        }

        // If tied, use updated_at as tie-breaker (newer first)
        const dateA = new Date(a.updated_at || 0).getTime();
        const dateB = new Date(b.updated_at || 0).getTime();
        return dateB - dateA;
      });
    });
    return groups;
  }, [drafts]);

  const handleDownloadMasterPDF = async (caseId: string) => {
    toast.loading('Generating Master PDF filing pack...', { id: 'pdf-gen' });
    try {
      const response = await customFetch(`/api/documents/filled-court-forms/download_master_pdf/?case_id=${caseId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Master_Filing_Pack_${caseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Filing pack ready for download', { id: 'pdf-gen' });
      } else {
        toast.error('Failed to generate master PDF', { id: 'pdf-gen' });
      }
    } catch (error) {
      toast.error('Error downloading PDF', { id: 'pdf-gen' });
    }
  };

  const handleUpdatePriority = async (formId: string, priority: string) => {
    if (!priority) return;
    try {
      const response = await customFetch(`/api/documents/filled-court-forms/${formId}/update_priority/`, {
        method: 'POST',
        body: JSON.stringify({ priority })
      });
      if (response.ok) {
        toast.success('Sequence updated');
        // Silent refresh of data to show new order without page reload
        fetchData(false);
      }
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const handlePreviewAll = async (caseId: string) => {
    setPreviewLoading(true);
    setPreviewCaseId(caseId);
    setPreviewForms([]);

    try {
      // 1. Fetch source of truth metadata and FULL content from backend
      const response = await customFetch(API.DOCUMENTS.FILLED_COURT_FORMS.PREVIEW_FILING_PACK(caseId));
      if (!response.ok) throw new Error('Failed to fetch preview metadata');
      const meta = await response.json();

      // meta contains: forms (full objects), index_data, form_pages { id: { page_label, num_pages } }

      // 2. Resolve final sheet list
      let finalSheets: any[] = [];
      const { forms, index_data, form_pages } = meta;

      // Identify if an explicit Index Form exists in the forms list
      const hasRealIndex = forms.some((f: any) => f.template_name?.toUpperCase().includes('INDEX'));

      // If no real index exists, prepend a virtual one using the same logic as the backend
      if (!hasRealIndex) {
        const virtualIndexID = 'virtual-index';
        const virtualIndex = {
          id: virtualIndexID,
          template_name: 'INDEX OF DOCUMENTS',
          field_values: { index_data },
          filled_content: {
            sections: [
              { type: 'header', content: 'INDEX OF DOCUMENTS', style: { align: 'center', bold: true, size: 16, underline: true } },
              { type: 'spacer', height: 20 },
              { type: 'auto_index_table' }
            ]
          }
        };
        // Process virtual index
        finalSheets.push({
          ...virtualIndex,
          id: `${virtualIndexID}-pg1`,
          calculatedPage: '1',
          filled_content: { ...virtualIndex.filled_content, sections: virtualIndex.filled_content.sections }
        });
      }

      for (const formEntry of forms) {
        const pageMeta = form_pages[formEntry.id] || { page_label: "?", num_pages: 1 };
        const isIndex = formEntry.template_name?.toUpperCase().includes('INDEX');

        if (isIndex) {
          formEntry.field_values = { ...formEntry.field_values, index_data };
        }

        const sections = formEntry.filled_content?.sections || [];
        const targetNumPages = pageMeta.num_pages || 1;
        const pageLabel = pageMeta.page_label || "";

        // Intelligent Section Splitting based on height estimation
        let chunks: any[] = [];
        let currentChunk: any[] = [];
        let currentHeight = 0;
        const MAX_A4_HEIGHT = 880; // Estimated usable pixels per A4 page

        sections.forEach((s: any) => {
          // Estimate height of the section
          let estimatedHeight = 30; // Base padding/margin
          if (s.type === 'header') estimatedHeight = 45;
          if (s.type === 'spacer') estimatedHeight = (s.height || 20) * 1.5;
          if (s.type === 'paragraph') {
            const lines = Math.ceil((s.content?.length || 0) / 85) || 1;
            estimatedHeight = lines * 22 + 20;
          }
          if (s.type === 'form_grid') estimatedHeight = (s.rows?.length || 0) * 48 + 20;
          if (s.type === 'grid_row') estimatedHeight = 80;
          if (s.type === 'table' || s.type === 'dynamic_table') {
            const rows = (s.rows?.length || (typeof s.rows === 'number' ? s.rows : 0));
            estimatedHeight = rows * 40 + 60;
          }
          if (s.type === 'signature_block') estimatedHeight = 110;
          if (s.type === 'auto_index_table') estimatedHeight = (formEntry.field_values?.index_data?.length || 0) * 45 + 60;

          // Split if manual page_break OR height overflow
          if (s.type === 'page_break' || (currentHeight + estimatedHeight > MAX_A4_HEIGHT && currentChunk.length > 0)) {
            chunks.push(currentChunk);
            currentChunk = [];
            currentHeight = 0;
            if (s.type === 'page_break') return;
          }

          currentChunk.push(s);
          currentHeight += estimatedHeight;
        });

        if (currentChunk.length > 0) chunks.push(currentChunk);

        // Ensure we respect the backend's page count by padding or merging
        if (chunks.length < targetNumPages) {
          // If we have fewer chunks than the backend says, we pad with empty pages
          while (chunks.length < targetNumPages) chunks.push([]);
        } else if (chunks.length > targetNumPages && targetNumPages > 0) {
          // If we have too many chunks, merge the tail to maintain numbering sync
          const extra = chunks.splice(targetNumPages - 1);
          const flattened = extra.reduce((acc, val) => acc.concat(val), []);
          chunks.push(flattened);
        }

        // Add each chunk as a separate physical sheet
        chunks.forEach((chunk, i) => {
          let sheetNumber = "";
          if (pageLabel.includes('TO')) {
            const parts = pageLabel.split(' '); // "2 TO 4"
            const start = parts[0];
            if (!isNaN(parseInt(start))) {
              sheetNumber = String(parseInt(start) + i);
            } else {
              sheetNumber = String.fromCharCode(start.charCodeAt(0) + i);
            }
          } else {
            sheetNumber = pageLabel;
          }

          finalSheets.push({
            ...formEntry,
            id: `${formEntry.id || 'idx'}-pg${i + 1}`,
            calculatedPage: sheetNumber,
            filled_content: { ...formEntry.filled_content, sections: chunk }
          });
        });
      }

      setPreviewForms(finalSheets);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate preview');
      setPreviewCaseId(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageSection
        eyebrow="Drafting"
        title={`${roleTitle} Draft Workspace`}
        description="Draft petitions and supporting legal documents for assigned matters. Documents are organized by Case for easy filing pack management."
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="ml-3 text-sm text-gray-400">Loading your draft workspace...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
      ) : Object.keys(groupedByCase).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <PenTool className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-lg font-semibold text-gray-700">Your draft workspace is empty</p>
          <p className="text-sm mt-1 max-w-sm">Go to any Case Detail page &gt; Drafting tab to start creating court forms and petitions.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-900" />
                Select Case Workspace
              </h3>
              <div className="relative group max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by Case No. or Title..."
                  value={caseSearchQuery}
                  onChange={(e) => setCaseSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-semibold outline-none focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-500/5 transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>
            <div className="px-6 py-2 overflow-x-auto max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              <SimpleTabs
                tabs={allCases
                  .filter(c => {
                    if (!caseSearchQuery) return true;
                    const q = caseSearchQuery.toLowerCase();
                    return (c.case_number || '').toLowerCase().includes(q) ||
                      (c.case_title || '').toLowerCase().includes(q);
                  })
                  .map(c => ({
                    label: c.case_number || c.case_title || 'Untitled',
                    active: String(c.id) === selectedCaseId
                  }))}
                onClick={(label) => {
                  const c = allCases.find(cas => (cas.case_number || cas.case_title) === label);
                  if (c) setSelectedCaseId(String(c.id));
                }}
              />
            </div>
          </div>

          {allCases
            .filter((c) => String(c.id) === selectedCaseId)
            .map((currentCase) => {
              const caseEntries = groupedByCase[currentCase.case_number || 'Unknown Case'] || [];
              return (
                <Panel
                  key={currentCase.id}
                  title={`Case Filing Pack: ${currentCase.case_number || currentCase.case_title}`}
                  subtitle={`${caseEntries.length} documents arranged for filing`}
                  className="relative"
                  actions={
                    <div className="flex gap-2">
                      <div className="hidden lg:flex items-center mr-4 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100 gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-[10px] text-purple-700 font-bold uppercase tracking-tight">
                          Reorder Filing Pack: Lower numbers (1, 2, 3) appear first.
                        </span>
                      </div>
                      <Link
                        href={viewBase?.includes('paralegal')
                          ? `/paralegal/cases/${currentCase.id}?tab=Drafting&newBlank=true`
                          : `/advocate/cases/${currentCase.id}?tab=Drafting&newBlank=true`
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 border border-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Blank Draft
                      </Link>
                      {caseEntries.length > 0 && (
                        <>
                          <button
                            onClick={() => handlePreviewAll(currentCase.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 border border-indigo-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview All
                          </button>
                          <button
                            onClick={() => handleDownloadMasterPDF(currentCase.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-900 border border-purple-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-800 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Master PDF
                          </button>
                        </>
                      )}
                      <Link
                        href={viewBase?.includes('paralegal') ? `/paralegal/cases/${currentCase.id}` : `/advocate/cases/${currentCase.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                      >
                        Go to Case
                      </Link>
                    </div>
                  }
                >
                  {caseEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <PenTool className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="text-sm font-medium">No documents drafted for this case yet.</p>
                      <p className="text-xs mt-1">Click 'New Blank Draft' to start drafting court forms.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Sl. No</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Priority</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Document Type</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Owner</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Update</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Draft Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {caseEntries.map((d, index) => (
                            <tr key={d.id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="px-4 py-4 text-sm font-bold text-gray-500">{String(index + 1).padStart(2, '0')}.</td>
                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  defaultValue={index + 1}
                                  className={classNames(
                                    "w-16 h-10 text-base border rounded-xl text-center focus:ring-2 focus:ring-purple-500 outline-none font-bold transition-all shadow-sm",
                                    d.custom_sequence
                                      ? "bg-purple-600 border-purple-700 text-white"
                                      : "bg-gray-50 border-gray-200 text-gray-900"
                                  )}
                                  onBlur={(e) => {
                                    const newVal = parseInt(e.target.value);
                                    if (newVal !== (index + 1)) {
                                      handleUpdatePriority(d.id, e.target.value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newVal = parseInt((e.target as HTMLInputElement).value);
                                      if (newVal !== (index + 1)) {
                                        handleUpdatePriority(d.id, (e.target as HTMLInputElement).value);
                                      }
                                    }
                                  }}
                                  title="Change number to reorder. 1 is first, 2 is second, etc. Press Enter to save."
                                />
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-sm font-bold text-gray-900">{d.template_name}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1.5 mt-0.5">
                                  <span className={d.custom_sequence ? "text-purple-600" : "text-gray-400"}>
                                    Sequence: {index + 1}
                                  </span>
                                </p>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600 font-medium">{d.created_by_name}</td>
                              <td className="px-4 py-4">
                                <Badge
                                  label={d.status_display || d.status}
                                  tone={
                                    d.status === 'draft' ? 'default' :
                                      d.status === 'signed' ? 'success' :
                                        d.status === 'completed' ? 'info' : 'warning'
                                  }
                                />
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">{new Date(d.updated_at).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-right">
                                <Link
                                  href={viewBase?.includes('paralegal') ? `/paralegal/cases/${d.case}?tab=Drafting&formId=${d.id}` : `/advocate/cases/${d.case}?tab=Drafting&formId=${d.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-purple-900 hover:bg-purple-50 transition-colors"
                                >
                                  Edit Draft
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              );
            })}
        </div>
      )}

      {/* Filing Pack Preview Modal */}
      {
        previewCaseId && (
          <div className="fixed inset-0 z-50 bg-black/70 flex flex-col">
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-lg">
              <div>
                <h2 className="text-base font-bold text-gray-900">Filing Pack Preview</h2>
                <p className="text-xs text-gray-500">{previewForms.length} documents in order</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleDownloadMasterPDF(previewCaseId)}
                  className="inline-flex items-center gap-1.5 bg-purple-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-purple-800">
                  <Download className="w-4 h-4" /> Download Master PDF
                </button>
                <button onClick={() => { setPreviewCaseId(null); setPreviewForms([]); }}
                  className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-300 px-8 py-10">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <span className="ml-3 text-white font-medium">Loading documents...</span>
                </div>
              ) : (
                <div className="space-y-10" style={{ maxWidth: '794px', margin: '0 auto' }}>
                  {previewForms.map((form, pageIdx) => (
                    <div key={form.id} className="relative">
                      <div className="absolute -top-6 left-0 text-xs text-gray-500 font-bold uppercase tracking-widest">
                        {String(pageIdx + 1).padStart(2, '0')}. {form.template_name}
                      </div>
                      <div className="bg-white shadow-2xl relative overflow-hidden" style={{ width: '794px', height: '1123px', padding: '72px' }}>
                        <div className="absolute top-10 right-10 flex flex-col items-end">
                          <div className="border border-black bg-white px-2.5 py-1.5 flex flex-col items-center min-w-[50px] shadow-sm">
                            <span className="text-[10px] font-black text-gray-500 leading-none mb-1">PAGE</span>
                            <span className="text-xl font-black text-black leading-none uppercase">{form.calculatedPage || pageIdx + 1}</span>
                          </div>
                        </div>
                        <FilingPackFormPreview form={form} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }
    </div>
  );
}

function FilingPackFormPreview({ form }: { form: any }) {
  const sections: any[] = form.filled_content?.sections || [];
  const values: Record<string, any> = form.field_values || {};
  const margins = form.filled_content?.margins || { top: 72, right: 72, bottom: 72, left: 72 };

  const formatSignatureUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = API_BASE_URL || 'https://antlegal.anthemgt.com';
    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  };

  const resolve = (s: string) => {
    if (!s) return null;

    // First handle field replacements
    const parts = s.split(/(\{([^}]+)\})/g);
    // filter out the capture groups from split
    const actualParts = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) actualParts.push({ type: 'text', val: parts[i] });
      else if (i % 3 === 1) {
        const fieldName = parts[i].slice(1, -1);
        actualParts.push({ type: 'field', val: values[fieldName] || '' });
        i++; // skip next group
      }
    }

    return actualParts.map((part, i) => {
      if (part.type === 'field') {
        return (
          <span key={i} className="inline-block border-b border-gray-900 px-1 font-bold text-center min-w-[120px]">
            {part.val || '\u00A0'}
          </span>
        );
      }

      // Handle simple markdown bold **text** and underline __text__
      const val = part.val || '';
      const subParts = val.split(/(\*\*[^*]+\*\*|__[^*]+__)/g);
      return subParts.map((sub, j) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return <strong key={`${i}-${j}`}>{sub.slice(2, -2)}</strong>;
        }
        if (sub.startsWith('__') && sub.endsWith('__')) {
          return <u key={`${i}-${j}`}>{sub.slice(2, -2)}</u>;
        }
        return <span key={`${i}-${j}`}>{sub}</span>;
      });
    });
  };

  return (
    <div className="text-black text-[13px] leading-[1.6]">
      {sections.map((section: any, i: number) => {
        const st = section.style || {};
        const alignment = st.align === 'center' ? 'text-center' : st.align === 'right' ? 'text-right' : 'text-left';

        if (section.type === 'header') return (
          <div key={i} className={`mb-4 uppercase tracking-tight py-1 px-2 ${alignment} ${st.bold !== false ? 'font-bold' : ''} ${st.underline ? 'underline' : ''} ${st.background ? 'bg-gray-100 border-y border-gray-200' : ''}`}
            style={{ fontSize: `${st.size || 16}px` }}>
            {resolve(section.content)}
          </div>
        );

        if (section.type === 'editable_line') return (
          <div key={i} className={`flex items-baseline mb-4 gap-1 ${alignment} ${st.bold ? 'font-bold' : ''}`}
            style={{ fontSize: `${st.size || 13}px` }}>
            {section.prefix && <span className="whitespace-nowrap">{section.prefix}</span>}
            <div className="flex-1 border-b border-gray-900 px-1 font-bold min-w-[50px] min-h-[18px]">
              {resolve(section.content) || values[section.field] || ''}
            </div>
            {section.suffix && <span className="whitespace-nowrap">{section.suffix}</span>}
          </div>
        );

        if (section.type === 'stamp_box') return (
          <div key={i} className="flex justify-center my-4">
            <div className="w-[250px] h-[100px] border-2 border-gray-800 flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs">
              Affix Stamp Here
            </div>
          </div>
        );

        if (section.type === 'paragraph') {
          const pLower = (section.content || '').toLowerCase();
          const isPSign = pLower.includes('signature') || pLower.includes('hand of') || pLower.includes('yours faithfully');
          const pAdvSign = isPSign && (pLower.includes('advocate') || pLower.includes('counsel'));
          const pCliSign = isPSign && (pLower.includes('client') || pLower.includes('deponent') || pLower.includes('party'));
          const pSigImg = pAdvSign ? form.advocate_signature_image : pCliSign ? form.client_signature_image : null;

          return (
            <div key={i} className="mb-4">
              {pSigImg && (
                <div className={`flex ${st.align === 'center' ? 'justify-center' : st.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                  <img src={formatSignatureUrl(pSigImg)} alt="Signature" className="h-14 object-contain mb-[-10px] relative z-10" />
                </div>
              )}
              <p className={`${alignment} ${st.bold ? 'font-bold' : ''} ${st.italic ? 'italic' : ''} ${st.underline ? 'underline' : ''}`}
                style={{ lineHeight: st.line_height || 1.4, fontSize: `${st.size || 12}px` }}>
                {resolve(section.content)}
              </p>
            </div>
          );
        }

        if (section.type === 'textarea') {
          const fn = section.field || 'document_content';
          return (
            <div key={i} className={`mb-4 ${alignment}`} style={{
              lineHeight: st.line_height || 1.8,
              fontSize: `${st.size || 14}px`
            }}
              dangerouslySetInnerHTML={{ __html: values[fn] || '' }} />
          );
        }

        if (section.type === 'spacer') return <div key={i} style={{ height: `${section.height || 20}px` }} />;

        if (section.type === 'grid_row') {
          return (
            <div key={i} className="flex gap-4 mb-4 py-1" style={st.border ? { border: '1px solid black', padding: '8px' } : {}}>
              {section.columns.map((col: any, ci: number) => {
                const colPrefixLower = (col.prefix || '').toLowerCase();
                const isColSign = colPrefixLower.includes('signature') || colPrefixLower.includes('advocate') || colPrefixLower.includes('client');
                const colAdvSign = isColSign && (colPrefixLower.includes('advocate') || colPrefixLower.includes('counsel'));
                const colCliSign = isColSign && (colPrefixLower.includes('client') || colPrefixLower.includes('party') || colPrefixLower.includes('deponent'));
                const colSigImg = colAdvSign ? form.advocate_signature_image : colCliSign ? form.client_signature_image : null;

                return (
                  <div key={ci} className="flex-1 flex flex-col pt-4" style={{
                    flex: col.flex || 1,
                    alignItems: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start'
                  }}>
                    {colSigImg && (
                      <img src={formatSignatureUrl(colSigImg)} alt="Signature" className="h-12 object-contain mb-[-8px] relative z-10" />
                    )}
                    <div className="w-full flex items-center">
                      {col.prefix && <span className="text-black font-medium mr-1 text-[11px] whitespace-nowrap">{col.prefix}</span>}
                      <div className="flex-1 border-b border-dotted border-black min-h-[20px] font-bold text-center">
                        {resolve(col.content) || values[col.field] || ''}
                      </div>
                      {col.suffix && <span className="text-black font-medium ml-1 text-[11px] whitespace-nowrap">{col.suffix}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        if (section.type === 'form_grid') {
          return (
            <div key={i} className="mb-6">
              <table className="w-full border-collapse border border-black text-[12px]">
                <tbody>
                  {(section.rows || []).map((row: any, ri: number) => (
                    <tr key={ri}>
                      {(row.cells || []).map((cell: any, ci: number) => (
                        <td key={ci} className="border border-black px-3 py-2 bg-white" style={{ width: cell.flex ? `${(cell.flex / 2) * 100}%` : 'auto' }}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-start gap-2">
                              {cell.text && <span className="font-bold text-[10px] text-gray-400 flex-shrink-0">{cell.text}</span>}
                              {cell.label && <span className="font-bold text-[11px] uppercase text-gray-900">{cell.label}</span>}
                            </div>
                            <div className="font-bold text-[13px] text-black min-h-[18px] pl-4">
                              {values[cell.field] || (cell.placeholder ? <span className="text-gray-300 font-normal">{cell.placeholder}</span> : '')}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (section.type === 'form_grid') {
          return (
            <div key={i} className="border border-black w-full my-4">
              {section.rows.map((row: any, rowIndex: number) => (
                <div key={rowIndex} className="flex border-b border-black last:border-b-0 min-h-[35px]">
                  {row.cells.map((cell: any, cellIndex: number) => (
                    <div key={cellIndex}
                      className="p-1 px-2 border-r border-black last:border-r-0 flex items-center bg-white"
                      style={{ flex: cell.flex || 1, background: cell.background ? '#f3f4f6' : 'white' }}
                    >
                      {cell.label && (
                        <span className={`text-[10px] text-black font-bold mr-2 flex-shrink-0 ${cell.field ? 'w-[120px]' : ''}`}>
                          {cell.label}
                        </span>
                      )}
                      {cell.field ? (
                        <div className="flex-1 text-[11px] text-black font-bold">
                          {values[cell.field] || ''}
                        </div>
                      ) : (
                        cell.text && <span className="text-[10px] text-black flex-1 text-center font-bold uppercase">{cell.text}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }

        if (section.type === 'table_inline') {
          return (
            <div key={i} className="flex justify-center my-4">
              <table className="border-collapse">
                <tbody>
                  {(section.rows || []).map((row: any[], ri: number) => (
                    <tr key={ri}>
                      {row.map((cell: any, ci: number) => {
                        const content = cell.field ? (values[cell.content.replace(/[{}]/g, '')] || '') : cell.content;
                        return (
                          <td key={ci} className={`px-4 py-1 ${cell.align === 'right' ? 'text-right' : cell.align === 'center' ? 'text-center' : 'text-left'} ${cell.bold ? 'font-bold' : ''}`}
                            style={{ width: cell.width || 'auto', borderBottom: cell.field ? '1px solid black' : 'none' }}>
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (section.type === 'table' || section.type === 'dynamic_table') {
          const cols = section.columns || [];
          const rowCount = typeof section.rows === 'number' ? section.rows : 3;
          return (
            <div key={i} className="w-full overflow-hidden border border-black my-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {cols.map((col: any, j: number) => (
                      <th
                        key={j}
                        className="border border-black p-2 text-[10px] font-bold text-black uppercase text-center align-middle bg-gray-100"
                        style={{ width: col.width, height: '60px' }}
                      >
                        {typeof col === 'string' ? col : col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: rowCount }, (_, ri) => (
                    <tr key={ri}>
                      {cols.map((col: any, ci: number) => {
                        const fieldName = typeof col === 'string' ? `${section.field}_${ri}` : `${col.field}_${ri}`;
                        const cellVal = values[`cell_${ri}_${ci}`] || values[fieldName] || '';
                        const rH = section.row_height ? `${section.row_height}px` : (ri === 0 && cols.length > 5 ? '400px' : '40px');
                        return (
                          <td key={ci} className="border border-black p-2 text-sm text-black font-bold align-top" style={{ height: rH }}>
                            {cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (section.type === 'signature_block') {
          const sigLower = (section.content || '').toLowerCase();
          const isAdvocateSig = sigLower.includes('advocate') || sigLower.includes('mediator') || sigLower.includes('counsel');
          const isClientSig = sigLower.includes('client') || sigLower.includes('applicant') || sigLower.includes('party') || sigLower.includes('deponent');
          const sigImg = isAdvocateSig ? form.advocate_signature_image : isClientSig ? form.client_signature_image : null;

          return (
            <div key={i} className="my-4 flex flex-col items-center">
              {sigImg ? (
                <img src={formatSignatureUrl(sigImg)} alt="Signature" className="h-16 object-contain mb-1" />
              ) : (
                <div className="h-16" />
              )}
              <div className="border-t-2 border-black pt-2 min-w-[200px] text-center font-semibold text-base">
                {section.content}
              </div>
            </div>
          );
        }

        if (section.type === 'two_column_table') {
          return (
            <div key={i} className="flex justify-center my-4">
              <table className="border-collapse">
                <tbody>
                  {(section.left_column || []).map((leftText: string, idx: number) => {
                    const rightValue = section.right_column?.[idx] || '';
                    const isField = rightValue.startsWith('{') && rightValue.endsWith('}');
                    const fieldName = isField ? rightValue.slice(1, -1) : '';
                    const displayVal = isField ? (values[fieldName] || '') : rightValue;

                    return (
                      <tr key={idx}>
                        <td className="text-right pr-12 py-1 min-w-[150px]" style={{ fontSize: `${st.size || 14}px` }}>
                          {leftText}
                        </td>
                        <td className="text-left pl-12 py-1 font-bold min-w-[200px]" style={{ fontSize: `${st.size || 14}px` }}>
                          <span className="inline-block border-b border-black pb-0.5 min-w-[200px]">
                            {displayVal || '\u00A0'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        if (section.type === 'character_boxes') {
          return (
            <div key={i} className="flex border border-black w-full mb-[-1px]">
              <div className="w-[180px] p-2 border-r border-black text-[10px] font-bold flex flex-col justify-center bg-gray-50 flex-shrink-0 leading-tight">
                {section.label}
                {section.sublabel && <span className="font-normal text-[8px] italic mt-1">{section.sublabel}</span>}
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${section.cols || 25}, minmax(0, 1fr))` }}>
                {Array.from({ length: (section.cols || 25) * (section.rows || 1) }).map((_, bi) => (
                  <div key={bi} className="aspect-square border-r border-b border-black last:border-r-0 flex items-center justify-center font-bold text-xs uppercase">
                    {values[`${section.field}_${bi}`] || ''}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (section.type === 'auto_index_table') {
          // This is a special type for the auto-generated index
          return (
            <div key={i} className="my-4">
              <table className="w-full border-collapse border border-black text-[12px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-2 font-bold text-center w-[10%]">SL. NO.</th>
                    <th className="border border-black px-4 py-2 font-bold text-left w-[70%]">DESCRIPTION OF DOCUMENTS</th>
                    <th className="border border-black px-2 py-2 font-bold text-center w-[20%]">PAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {(values.index_data || []).map((row: any, ri: number) => (
                    <tr key={ri} className="min-h-[40px]">
                      <td className="border border-black px-2 py-3 text-center font-medium">{row.sl_no}</td>
                      <td className="border border-black px-4 py-3 font-bold uppercase tracking-tight">{row.desc}</td>
                      <td className="border border-black px-2 py-3 text-center font-bold">{row.page}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
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

export function ChangePasswordPanel({ accent }: AccentProps) {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await customFetch(API.USERS.CHANGE_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || (typeof data === 'object' ? Object.values(data)[0] : 'Failed to change password'));
      }

      setSuccess('Password changed successfully');
      setFormData({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Change Password" subtitle="Security update for your login credentials.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Old Password</label>
          <PasswordInput
            value={formData.old_password}
            onChange={v => setFormData({ ...formData, old_password: v })}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">New Password</label>
            <PasswordInput
              value={formData.new_password}
              onChange={v => setFormData({ ...formData, new_password: v })}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Confirm New Password</label>
            <PasswordInput
              value={formData.new_password_confirm}
              onChange={v => setFormData({ ...formData, new_password_confirm: v })}
              required
              autoComplete="new-password"
            />
          </div>
        </div>
        {error && <p className="text-xs font-semibold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
        {success && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{success}</p>}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#0e2340] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </Panel>
  );
}

export function ProfileInformationPanel({ accent }: AccentProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    gender: '',
    date_of_birth: '',
    aadhar_number: '',
    pan_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    bar_council_registration: '',
    bar_council_state: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const [profileFile, setProfileFile] = useState<File | null | 'REMOVE'>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [systemData, setSystemData] = useState<any>(null);

  useEffect(() => {
    let currentUserId: string | null = null;
    const details = localStorage.getItem('user_details');
    if (details) {
      try {
        const user = JSON.parse(details);
        currentUserId = user.id;
        setUserId(user.id);
      } catch (e) {
        console.error('Error parsing user_details:', e);
      }
    }

    if (currentUserId) {
      setFetching(true);
      customFetch(API.USERS.DETAIL(currentUserId))
        .then((res) => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then((user) => {
          setFormData(prev => ({
            ...prev,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            gender: user.gender || '',
            date_of_birth: user.date_of_birth || '',
            aadhar_number: user.aadhar_number || '',
            pan_number: user.pan_number || '',
            address_line_1: user.address_line_1 || '',
            address_line_2: user.address_line_2 || '',
            city: user.city || '',
            state: user.state || '',
            country: user.country || 'India',
            postal_code: user.postal_code || '',
            bar_council_registration: user.bar_council_registration || '',
            bar_council_state: user.bar_council_state || '',
          }));
          setProfilePreview(user.profile_image ? (user.profile_image.startsWith('http') ? user.profile_image : `${API_BASE_URL}${user.profile_image}`) : null);
          setSystemData({
            username: user.username,
            user_type: user.user_type,
            firm_name: user.firm_name,
            is_email_verified: user.is_email_verified,
            is_phone_verified: user.is_phone_verified,
            is_document_verified: user.is_document_verified,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
            password_set: user.password_set
          });
          // Optionally update localStorage if the profile has silently drifted
          localStorage.setItem('user_details', JSON.stringify({ ...JSON.parse(details || '{}'), ...user }));
          window.dispatchEvent(new Event('profile_updated'));
        })
        .catch(err => console.error('Error fetching live user data:', err))
        .finally(() => setFetching(false));
    } else {
      setFetching(false);
    }
  }, []);

  const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || systemData?.username || '';
  const userTypeLabel = systemData?.user_type
    ? systemData.user_type.charAt(0).toUpperCase() + systemData.user_type.slice(1).replace('_', ' ')
    : 'User';
  useTopbarTitle(fullName, fullName ? `${userTypeLabel} Profile` : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('User session not found. Please log in again.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = { ...formData };

      // Payload cleaning for backend compatibility
      if (payload.aadhar_number) {
        payload.aadhar_number = payload.aadhar_number.replace(/\s/g, '');
      }
      if (payload.phone_number) {
        payload.phone_number = payload.phone_number.replace(/\D/g, '');
      }

      if (!payload.date_of_birth) payload.date_of_birth = null;
      if (!payload.aadhar_number) payload.aadhar_number = null;
      if (!payload.pan_number) payload.pan_number = null;

      let response;
      if (profileFile instanceof File) {
        const fData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== null && val !== undefined && val !== '') {
            fData.append(key, String(val));
          }
        });
        fData.append('profile_image', profileFile);
        response = await customFetch(API.USERS.DETAIL(userId), {
          method: 'PATCH',
          body: fData,
        });
      } else {
        const finalPayload = profileFile === 'REMOVE' ? { ...payload, profile_image: null } : payload;
        response = await customFetch(API.USERS.DETAIL(userId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || (typeof data === 'object' ? Object.values(data)[0] : 'Failed to update profile'));
      }

      setSuccess('Profile updated successfully');
      localStorage.setItem('user_details', JSON.stringify(data));
      window.dispatchEvent(new Event('profile_updated'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (k: string, v: string) => {
    setFormData(p => ({ ...p, [k]: v }));
    setError('');
    setSuccess('');
  };

  if (fetching) return <div className="p-8 text-center text-sm text-gray-400 font-medium">Loading profile...</div>;

  return (
    <SplitPanels
      left={
        <Panel title="Profile Information" subtitle="Update your personal details and identity information.">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100 mt-2">
              <div className="relative group w-20 h-20 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfileFile(file);
                    setProfilePreview(URL.createObjectURL(file));
                  }
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {profilePreview ? (
                  <>
                    <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] uppercase font-bold tracking-wider">Change</span>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider group-hover:text-gray-500">Photo</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Profile Image</h3>
                <p className="text-xs text-gray-500 mt-1 mb-2">Upload a square image (max 5MB).</p>
                {profilePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileFile('REMOVE');
                      setProfilePreview(null);
                    }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={e => updateField('first_name', e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={e => updateField('last_name', e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Phone Number</label>
                <PhoneInput
                  value={formData.phone_number}
                  onChange={v => updateField('phone_number', v)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Gender</label>
                <select
                  value={formData.gender}
                  onChange={e => updateField('gender', e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none"
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={e => updateField('date_of_birth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Aadhar Number</label>
                <AadharInput
                  value={formData.aadhar_number}
                  onChange={v => updateField('aadhar_number', v)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">PAN Number</label>
                <PANInput
                  value={formData.pan_number}
                  onChange={v => updateField('pan_number', v)}
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-100">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#984c1f] mb-4">Professional Registration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Bar Council Reg</label>
                    <input
                      type="text"
                      value={formData.bar_council_registration}
                      onChange={e => updateField('bar_council_registration', e.target.value)}
                      placeholder="e.g. MH/1234/2020"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Bar Council State</label>
                    <select
                      value={formData.bar_council_state}
                      onChange={e => updateField('bar_council_state', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-100">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#984c1f] mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.address_line_1}
                      onChange={e => updateField('address_line_1', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.address_line_2}
                      onChange={e => updateField('address_line_2', e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Country</label>
                    <div className="relative group">
                      <select
                        value={formData.country}
                        onChange={e => {
                          updateField('country', e.target.value);
                          updateField('state', '');
                          updateField('city', '');
                        }}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none"
                      >
                        <option value="">Select Country</option>
                        {Country.getAllCountries().map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">State</label>
                    <div className="relative group">
                      <select
                        value={formData.state}
                        disabled={!formData.country}
                        onChange={e => {
                          updateField('state', e.target.value);
                          updateField('city', '');
                        }}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none disabled:opacity-50"
                      >
                        <option value="">Select State</option>
                        {formData.country && State.getStatesOfCountry(formData.country).map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">City</label>
                    <div className="relative group">
                      {formData.country && formData.state && City.getCitiesOfState(formData.country, formData.state).length > 0 ? (
                        <>
                          <select
                            value={formData.city}
                            onChange={e => updateField('city', e.target.value)}
                            className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors appearance-none"
                          >
                            <option value="">Select City</option>
                            {City.getCitiesOfState(formData.country, formData.state).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                        </>
                      ) : (
                        <input
                          type="text"
                          value={formData.city}
                          onChange={e => updateField('city', e.target.value)}
                          placeholder="Specify city..."
                          className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={e => updateField('postal_code', e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 400001"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#f7f8fa] px-3.5 text-sm text-black font-semibold outline-none focus:border-[#0e2340] transition-colors shadow-sm shadow-[#0e2340]/[0.02]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            {success && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{success}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-[#0e2340] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Panel>
      }
      right={
        <div className="space-y-6">
          {systemData ? (
            <Panel title="System Status" subtitle="Read-only account properties.">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#984c1f]">Verifications</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge label={systemData.is_active ? 'Active' : 'Inactive'} tone={systemData.is_active ? 'success' : 'default'} />
                    <Badge label={systemData.is_email_verified ? 'Email Verified' : 'Email Unverified'} tone={systemData.is_email_verified ? 'success' : 'warning'} />
                    <Badge label={systemData.is_phone_verified ? 'Phone Verified' : 'Phone Unverified'} tone={systemData.is_phone_verified ? 'success' : 'warning'} />
                    <Badge label={systemData.is_document_verified ? 'Docs Verified' : 'Docs Unverified'} tone={systemData.is_document_verified ? 'success' : 'warning'} />
                    <Badge label={systemData.password_set ? 'Password Locked' : 'No Password'} tone={systemData.password_set ? 'info' : 'warning'} />
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1.5">Platform Username</p>
                    <p className="text-sm font-medium text-gray-900 border border-gray-100 bg-gray-50/50 rounded-xl px-3.5 py-3 cursor-not-allowed truncate">{systemData.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1.5">System Role</p>
                    <p className="text-sm font-medium text-gray-900 border border-gray-100 bg-gray-50/50 rounded-xl px-3.5 py-3 cursor-not-allowed capitalize">{systemData.user_type ? systemData.user_type.replace('_', ' ') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1.5">Primary Firm Affinity</p>
                    <p className="text-sm font-medium text-gray-900 border border-gray-100 bg-gray-50/50 rounded-xl px-3.5 py-3 cursor-not-allowed truncate">{systemData.firm_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1.5">Account Registry Date</p>
                    <p className="text-sm font-medium text-gray-900 border border-gray-100 bg-gray-50/50 rounded-xl px-3.5 py-3 cursor-not-allowed">{systemData.created_at ? new Date(systemData.created_at).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
              </div>
            </Panel>
          ) : (
            <InfoAside accent={accent} title="Identity Info" items={['Update your personal details.', 'Change your core contact mechanisms.']} />
          )}
        </div>
      }
    />
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

export function CasesDirectoryPage({ accent, viewBase, category }: AccentProps & { viewBase?: string; category: 'pre_litigation' | 'court_case' }) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        let url = API.CASES.LIST;
        if (debouncedSearch) {
          url += `?search=${encodeURIComponent(debouncedSearch)}`;
        }

        const response = await customFetch(url);
        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || 'Failed to fetch cases');

        let results = data.results || data;
        // Client-side filtering because server-side ?category= is causing 500 errors
        if (category) {
          results = results.filter((c: any) => c.category === category);
        }

        setCases(results);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [category, debouncedSearch]);

  const rows = cases.map((c, i) => ({
    title: c.case_title,
    type: c.case_type,
    client: c.client_name || 'N/A',
    advocate: c.advocate_name || 'N/A',
    priority: c.priority,
    status: (c.stage || '').replace('_', ' '),
    viewHref: viewBase ? `${viewBase}/${c.id || c.uuid}` : undefined,
  }));

  const metrics = [
    { label: 'Total Cases', value: cases.length.toString() },
    { label: 'High Priority', value: cases.filter(c => c.priority === 'high').length.toString() },
    { label: 'In Evidence', value: cases.filter(c => c.stage === 'evidence').length.toString() },
    { label: 'Pending Docs', value: '0' },
  ];

  return (
    <div className="space-y-8">
      <PageSection
        title={category === 'pre_litigation' ? 'Pre-litigation Directory' : 'Court Case Directory'}
        description="Monitor and manage legal matters from initial filing to final judgment."
        actions={<ActionLink href={`/super-admin/cases/new?category=${category}`} label={`Add Case`} />}
      />
      <MetricGrid accent={accent} metrics={metrics} />
      <Panel
        title="Active Matters"
        actions={
          <SearchBar
            placeholder="Search cases, clients..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-4 text-sm text-gray-400">Loading directory...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-sm font-medium">Error: {error}</p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: 'title', label: 'Case Title' },
              { key: 'type', label: 'Type' },
              { key: 'client', label: 'Client' },
              { key: 'advocate', label: 'Advocate' },
              { key: 'priority', label: 'Priority' },
              { key: 'status', label: 'Stage' },
            ]}
            rows={rows}
          />
        )}
      </Panel>
    </div>
  );
}

