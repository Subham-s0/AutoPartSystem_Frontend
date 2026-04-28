export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    customerRegister: '/api/auth/register/customer',
    googleLogin: '/api/auth/login/google',
  },
  customer: {
    vehicles: '/api/customer/vehicles',
    appointments: '/api/customer/appointments',
    partRequests: '/api/customer/part-requests',
    reviews: '/api/customer/reviews',
    history: '/api/customer/history',
  },
  admin: {
    notifications: '/api/admin/notifications',
  },
} as const
