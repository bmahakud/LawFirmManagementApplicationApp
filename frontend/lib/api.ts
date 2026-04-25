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
    LIST: "/api/clients/",
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
    TIME_ENTRIES: {
      LIST: "/api/billing/time-entries/",
      CREATE: "/api/billing/time-entries/",
      DETAIL: (id: string) => `/api/billing/time-entries/${id}/`,
      MY_ENTRIES: (startDate: string, endDate: string) => `/api/billing/time-entries/my_entries/?start_date=${startDate}&end_date=${endDate}`,
      UNBILLED: "/api/billing/time-entries/unbilled/",
    }
  }
};

