export const caseTimeline = [
  { title: 'Case created', subtitle: 'Matter opened by Super Admin on 12 Mar 2026', tone: 'info' as const },
  { title: 'FIR uploaded and OCR parsed', subtitle: 'Applicable acts suggested: IPC 420, CrPC 154', tone: 'success' as const },
  { title: 'Filed before Sessions Court', subtitle: 'Filing confirmed on 18 Mar 2026', tone: 'default' as const },
  { title: 'Hearing 1 completed', subtitle: 'Adjourned for evidence review on 24 Mar 2026', tone: 'warning' as const },
  { title: 'Evidence stage in progress', subtitle: 'Senior advocate requested transfer notes', tone: 'danger' as const },
];

export const documentRows = [
  { name: 'FIR Copy', type: 'FIR', version: 'v2', uploadedBy: 'A. Sharma', date: '12 Mar 2026' },
  { name: 'Bail Petition Draft', type: 'Petition', version: 'v4', uploadedBy: 'R. Iyer', date: '18 Mar 2026' },
  { name: 'Evidence Bundle A', type: 'Evidence', version: 'v1', uploadedBy: 'S. Nair', date: '22 Mar 2026' },
  { name: 'Interim Order', type: 'Court Order', version: 'v1', uploadedBy: 'Court Clerk', date: '24 Mar 2026' },
];

export const activityRows = [
  { actor: 'Ritika Iyer', action: 'uploaded a revised petition draft for partner review.', time: 'Today, 11:20 AM' },
  { actor: 'Arjun Sharma', action: 'confirmed hearing notes and marked next deadline.', time: 'Today, 9:15 AM' },
  { actor: 'System OCR', action: 'extracted 14 key fields from FIR and suggested acts.', time: 'Yesterday, 7:40 PM' },
];

export const hearingRows = [
  { label: 'Upcoming hearing', value: '31 Mar 2026, Courtroom 4' },
  { label: 'Judge remarks', value: 'Submit evidence synopsis and witness list.' },
  { label: 'Adjournments', value: '2 total in current matter lifecycle' },
  { label: 'Bench', value: 'Hon. Justice N. Rao' },
];

export const invoiceRows = [
  { label: 'Open invoices', value: '6' },
  { label: 'Pending amount', value: 'Rs. 1,84,000' },
  { label: 'Paid this month', value: 'Rs. 4,52,000' },
  { label: 'Overdue follow-ups', value: '3 reminders due' },
];

export const caseFormFields = [
  { label: 'Case Title', placeholder: 'State vs. Mehta' },
  { label: 'Case Number', placeholder: 'CRL-2026-1042' },
  { label: 'Applicable Act(s)', placeholder: 'IPC 420, CrPC 154' },
  { label: 'Case Type', placeholder: 'Criminal' },
  { label: 'Case Category', placeholder: 'Fraud Investigation' },
  { label: 'Court Name', placeholder: 'Sessions Court' },
  { label: 'Court Location', placeholder: 'Mumbai' },
  { label: 'Filing Date', placeholder: '2026-03-12', type: 'date' },
  { label: 'Case Status', placeholder: 'Active' },
  { label: 'Client Name', placeholder: 'Select or create client' },
  { label: 'Client Contact Number', placeholder: '+91 98XXXXXX45' },
  { label: 'Client Email', placeholder: 'client@example.com', type: 'email' },
  { label: 'Opponent Name', placeholder: 'Apex Traders Pvt Ltd' },
  { label: 'Opponent Advocate', placeholder: 'Neha Kamat' },
  { label: 'Assign Advocate', placeholder: 'Ritika Iyer' },
  { label: 'Assign Paralegal(s)', placeholder: 'S. Nair, V. Deshmukh' },
  { label: 'Priority', placeholder: 'High' },
  { label: 'Next Hearing Date', placeholder: '2026-03-31', type: 'date' },
  { label: 'Case Fees', placeholder: '350000', type: 'number' },
  { label: 'Billing Type', placeholder: 'Fixed' },
  { label: 'Advance Paid', placeholder: '100000', type: 'number' },
  { label: 'Case Summary', placeholder: 'Detailed summary of facts, legal issues, and filing context.', type: 'textarea', wide: true },
  { label: 'Internal Notes', placeholder: 'Internal remarks visible to firm team only.', type: 'textarea', wide: true },
];

export const teamFields = [
  { label: 'Full Name', placeholder: 'Ritika Iyer' },
  { label: 'Role', placeholder: 'Advocate' },
  { label: 'Email', placeholder: 'ritika@firm.com', type: 'email' },
  { label: 'Phone', placeholder: '+91 98XXXXXX45' },
  { label: 'Member Type', placeholder: 'Litigation' },
  { label: 'Reporting To', placeholder: 'Super Admin' },
];

export const clientFields = [
  { label: 'Client Name', placeholder: 'Amit Mehta' },
  { label: 'Phone Number', placeholder: '+91 99XXXXXX12' },
  { label: 'Email', placeholder: 'amit@example.com', type: 'email' },
  { label: 'Preferred Contact Mode', placeholder: 'Email + Phone' },
  { label: 'Address', placeholder: 'Full residential or office address', type: 'textarea', wide: true },
  { label: 'Matter Notes', placeholder: 'Sensitive intake notes and relationship context.', type: 'textarea', wide: true },
];

export const reportCards = [
  { label: 'Case Status Report', value: 'Running vs disposed vs closed matters' },
  { label: 'Advocate Workload', value: 'Assignments, deadlines, and hearing density' },
  { label: 'Billing Realization', value: 'Invoices, collections, overdue balances' },
  { label: 'Client Intake Report', value: 'New clients, active matters, practice-area mix' },
];
