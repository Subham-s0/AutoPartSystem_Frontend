export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    customerRegister: '/api/auth/register/customer',
    staffRegister: '/api/auth/register/staff',
    googleLogin: '/api/auth/login/google',
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
  },
  admin: {
    notifications: '/api/admin/notifications',
    staff: '/api/admin/staff',
  },
  staff: {
    salesInvoices: '/api/staff/sales-invoices',
    salesInvoiceLookups: '/api/staff/sales-invoices/lookups',
    vehicles: '/api/staff/vehicles',
    customerReports: {
      regulars: '/api/staff/reports/customers/regulars',
      highSpenders: '/api/staff/reports/customers/high-spenders',
      pendingCredits: '/api/staff/reports/customers/pending-credits',
    },
  },
} as const
