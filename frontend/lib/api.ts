export const API_BASE_URL = "https://antlegal.anthemgt.com";

/**
 * Complete AntLegal API Reference Layer.
 * Base URL: https://antlegal.anthemgt.com
 */
export const API = {
  AUTH: {
    LOGIN_USERNAME_PASSWORD: "/api/auth/login_username_password/",
    LOGOUT: "/api/auth/logout/",
    REQUEST_PHONE_OTP: "/api/auth/send_otp/",
    REQUEST_EMAIL_OTP: "/api/auth/request_email_otp/",
    VERIFY_OTP: "/api/auth/verify_otp/"
  },
  DASHBOARD: {
    GET: "/api/dashboard/"
  },
  USERS: {
    LIST: "/api/users/",
    DETAIL: (id: string) => `/api/users/${id}/`,
    REGISTER: "/api/users/register/",
    ADD_USER: "/api/users/add_user/",
    SWITCH_FIRM: "/api/users/switch_firm/",
    CHANGE_PASSWORD: "/api/users/change_password/"
  },
  FIRMS: {
    LIST: "/api/firms/",
    CREATE: "/api/firms/",
    DETAIL: (uuid: string) => `/api/firms/${uuid}/`,
    BRANCHES: {
      LIST: "/api/branches/",
      CREATE: "/api/branches/",
      DETAIL: (uuid: string) => `/api/branches/${uuid}/`
    }
  },
  DOCUMENTS: {
    LIST: "/api/documents/",
    UPLOAD: "/api/documents/",
    DETAIL: (uuid: string) => `/api/documents/${uuid}/`,
    USER_DOCUMENTS: "/api/documents/user_documents/",
    BY_CLIENT: "/api/documents/by_client/",
    BY_CASE: "/api/documents/by_case/"
  },
  CLIENTS: {
    LIST: "/api/users/?user_type=client",
    DETAIL: (uuid: string) => `/api/clients/${uuid}/`,
    MY_CLIENTS: "/api/clients/my-clients/",
    CLIENT_DOCUMENTS: (uuid: string) => `/api/clients/${uuid}/documents/`
  },
  PARTNERS: {
    LIST: "/api/partners/",
    ADD: "/api/partners/",
    DETAIL: (uuid: string) => `/api/partners/${uuid}/`
  },
  AUDIT_LOGS: {
    LIST: "/api/audit-logs/",
    DETAIL: (uuid: string) => `/api/audit-logs/${uuid}/`
  },
  CONFIG: {
    GET: "/api/config/settings/",
    PUBLIC: "/api/config/settings/public/",
    UPDATE: "/api/config/update_settings/"
  },
  CASES: {
    LIST: "/api/cases/cases/",
    CREATE: "/api/cases/cases/",
    DETAIL: (id: string) => `/api/cases/cases/${id}/`
  },
  JOIN_LINKS: {
    LIST: "/api/join-links/",
    CREATE: "/api/join-links/",
    DETAIL: (id: string) => `/api/join-links/${id}/`,
    DELETE: (id: string) => `/api/join-links/${id}/`,
    GET_DETAILS: (id: string) => `/api/join-links/${id}/details/`,
    JOIN: (id: string) => `/api/join-links/${id}/join//`
  },
  CALENDAR: {
    EVENTS: "/api/calendar/events/",
    MONTH_VIEW: (year: number, month: number) => `/api/calendar/events/month_view/?year=${year}&month=${month}`,
    WEEK_VIEW: "/api/calendar/events/week_view/",
    DAY_VIEW: (date: string) => `/api/calendar/events/day_view/?date=${date}`,
    TODAY: "/api/calendar/events/today/",
    UPCOMING: "/api/calendar/events/upcoming/",
    DETAIL: (id: string) => `/api/calendar/events/${id}/`,
    MARK_COMPLETED: (id: string) => `/api/calendar/events/${id}/mark_completed/`,
    CANCEL: (id: string) => `/api/calendar/events/${id}/cancel/`
  },
  BILLING: {
    FINANCE_OVERVIEW: {
      DASHBOARD: "/api/billing/finance-overview/dashboard/",
    },
    INVOICES: {
      LIST: "/api/billing/invoices/",
      CREATE: "/api/billing/invoices/",
      DETAIL: (id: string) => `/api/billing/invoices/${id}/`,
      STATS: "/api/billing/invoices/stats/",
      OVERDUE: "/api/billing/invoices/overdue/",
      UNPAID: "/api/billing/invoices/unpaid/",
    },
    ADVOCATE_INVOICES: {
      LIST: "/api/billing/advocate-invoices/",
      CREATE: "/api/billing/advocate-invoices/",
      DETAIL: (id: string) => `/api/billing/advocate-invoices/${id}/`,
      SUBMIT: (id: string) => `/api/billing/advocate-invoices/${id}/submit/`,
      REVIEW: (id: string) => `/api/billing/advocate-invoices/${id}/review/`,
      PAY: (id: string) => `/api/billing/advocate-invoices/${id}/pay/`,
      MY_INVOICES: "/api/billing/advocate-invoices/my_invoices/",
      PENDING_APPROVAL: "/api/billing/advocate-invoices/pending_approval/",
      STATS: "/api/billing/advocate-invoices/stats/",
    },
    TIME_ENTRIES: {
      LIST: "/api/billing/time-entries/",
      CREATE: "/api/billing/time-entries/",
      DETAIL: (id: string) => `/api/billing/time-entries/${id}/`,
      MY_ENTRIES: (startDate: string, endDate: string) => `/api/billing/time-entries/my_entries/?start_date=${startDate}&end_date=${endDate}`,
      UNBILLED: "/api/billing/time-entries/unbilled/",
    },
    EXPENSES: {
      LIST: "/api/billing/expenses/",
      CREATE: "/api/billing/expenses/",
      DETAIL: (id: string) => `/api/billing/expenses/${id}/`,
      UNBILLED: "/api/billing/expenses/unbilled/",
    }
  },
  SUBSCRIPTIONS: {
    ACTIVATE: "/api/subscriptions/firm-subscriptions/activate/",
    UPGRADE: "/api/subscriptions/firm-subscriptions/upgrade/",
    STATUS: "/api/subscriptions/firm-subscriptions/status/",
    PLANS: {
      LIST: "/api/subscriptions/plans/",
      DETAIL: (id: string) => `/api/subscriptions/plans/${id}/`,
    },
    PLATFORM_INVOICES: {
      LIST: "/api/subscriptions/platform-invoices/",
      CREATE: "/api/subscriptions/platform-invoices/",
      DETAIL: (id: string) => `/api/subscriptions/platform-invoices/${id}/`,
      SEND: (id: string) => `/api/subscriptions/platform-invoices/${id}/send/`,
      MARK_PAID: (id: string) => `/api/subscriptions/platform-invoices/${id}/mark_paid/`,
      CANCEL: (id: string) => `/api/subscriptions/platform-invoices/${id}/cancel/`,
    }
  }
};

export const SUBSCRIPTION_PLANS = [
  { id: 'da973639-6c65-48ec-b23f-09568671748f', name: 'Trial', price: '₹0', period: '14 days' },
  { id: 'd6b8bcb2-37d5-49fe-b6b5-76081ac38a1d', name: 'Basic', price: '₹999', period: 'month' },
  { id: '81d8de45-4415-42f8-8864-8e2b7d9d7812', name: 'Business', price: '₹2,499', period: 'month' },
  { id: '4f468d40-a761-4e26-a7f5-a4f8e45c7534', name: 'Enterprise', price: 'Custom', period: '' },
] as const;


