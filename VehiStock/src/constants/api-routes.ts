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
    partRequests: '/api/customer/part-requests',
    reviews: '/api/customer/reviews',
    history: '/api/customer/history',
    purchaseHistory: '/api/customer/history/purchases',
    serviceHistory: '/api/customer/history/services',
  },
  admin: {
    notifications: '/api/admin/notifications',
    staff: '/api/admin/staff',
  },
  staff: {
    salesInvoices: '/api/staff/sales-invoices',
    salesInvoiceLookups: '/api/staff/sales-invoices/lookups',
    customerReports: {
      regulars: '/api/staff/reports/customers/regulars',
      highSpenders: '/api/staff/reports/customers/high-spenders',
      pendingCredits: '/api/staff/reports/customers/pending-credits',
    },
  },
} as const
