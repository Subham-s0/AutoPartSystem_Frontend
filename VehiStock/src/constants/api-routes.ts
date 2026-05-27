export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    customerRegister: '/api/auth/register/customer',
    staffRegister: '/api/auth/register/staff',
    googleLogin: '/api/auth/login/google',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },
  notifications: {
    current: '/api/notifications',
  },
  customer: {
    vehicles: '/api/customer/vehicles',
    appointments: '/api/customer/appointments',
    appointmentDetail: (appointmentId: number | string) =>
      `/api/customer/appointments/${appointmentId}`,
    partRequests: '/api/customer/part-requests',
    reviews: '/api/customer/reviews',
    reviewsUnreviewed: '/api/customer/reviews/unreviewed',
    history: '/api/customer/history',
    purchaseHistory: '/api/customer/history/purchases',
    purchaseHistoryDetail: (salesInvoiceId: number | string) =>
      `/api/customer/history/purchases/${salesInvoiceId}`,
    serviceHistory: '/api/customer/history/services',
    serviceHistoryDetail: (serviceRecordId: number | string) =>
      `/api/customer/history/services/${serviceRecordId}`,
    serviceInvoices: '/api/customer/service-invoices',
    serviceInvoiceDetail: (serviceInvoiceId: number | string) =>
      `/api/customer/service-invoices/${serviceInvoiceId}`,
    serviceInvoiceLoyalty: (serviceInvoiceId: number | string) =>
      `/api/customer/service-invoices/${serviceInvoiceId}/loyalty`,
    serviceInvoicePaymentInitiate: (serviceInvoiceId: number | string) =>
      `/api/customer/service-invoices/${serviceInvoiceId}/payments/initiate`,
    serviceInvoicePaymentVerify: '/api/customer/service-invoices/payments/verify',
    purchasePaymentInitiate: (salesInvoiceId: number | string) =>
      `/api/customer/purchases/${salesInvoiceId}/payments/initiate`,
    purchaseInvoiceLoyalty: (salesInvoiceId: number | string) =>
      `/api/customer/purchases/${salesInvoiceId}/loyalty`,
    payments: '/api/customer/payments',
    dashboard: '/api/customer/dashboard',
  },
  admin: {
    analytics: '/api/admin/analytics',
    notifications: '/api/admin/notifications',
    staff: '/api/admin/staff',
    staffDetail: (userId: string) => `/api/admin/staff/${userId}`,
    customers: '/api/admin/customers',
    customerDetail: (customerId: number | string) => `/api/admin/customers/${customerId}`,
    vendors: '/api/admin/vendors',
    inventory: '/api/admin/inventory',
    /** Admin part-request management (new) */
    partRequests: '/api/admin/part-requests',
    /** Analytics / dashboard summary (new) */
    analytics: '/api/admin/analytics/dashboard-summary',
    partRequests: '/api/admin/part-requests',
    parts: '/api/parts',
    purchaseInvoices: '/api/purchaseinvoices',
    reports: {
      daily: '/api/admin/reports/daily',
      monthly: '/api/admin/reports/monthly',
      yearly: '/api/admin/reports/yearly',
    },
  },
  staff: {
    dashboard: '/api/staff/dashboard',
    appointments: '/api/staff/appointments',
    serviceRecords: '/api/staff/service-records',
    salesInvoices: '/api/staff/sales-invoices',
    salesInvoiceDetail: (invoiceId: number | string) => `/api/staff/sales-invoices/${invoiceId}`,
    salesInvoiceLookups: '/api/staff/sales-invoices/lookups',
    vehicles: '/api/staff/vehicles',
    customersSearch: '/api/staff/customers/search',
    customerDetail: (customerId: number | string) => `/api/staff/customers/${customerId}`,
    customerHistory: (customerId: number | string) => `/api/staff/customers/${customerId}/history`,
    customerReports: {
      summary: '/api/staff/reports/customers/summary',
      regulars: '/api/staff/reports/customers/regulars',
      highSpenders: '/api/staff/reports/customers/high-spenders',
      pendingCredits: '/api/staff/reports/customers/pending-credits',
    },
  },
  /** Parts (inventory) — GET /api/parts with pagination */
  parts: '/api/parts',
} as const
