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
    DETAIL: (uuid: string) => `/api/documents/${uuid}/`
  },
  CLIENTS: {
    LIST: "/api/clients/",
    DETAIL: (uuid: string) => `/api/clients/${uuid}/`
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
    UPDATE: "/api/config/update_settings/"
  },
  CASES: {
    LIST: "/api/cases/cases/",
    CREATE: "/api/cases/cases/",
    DETAIL: (id: string) => `/api/cases/cases/${id}/`
  }
};

