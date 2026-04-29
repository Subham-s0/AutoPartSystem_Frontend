import { ROLE_NAMES, type UserRole } from '@/constants/roles'
import type { PageMeta } from '@/types/common'

export const ROUTE_PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
  adminLogin: '/admin/login',
  admin: {
    dashboard: '/admin',
    inventory: '/admin/inventory',
    vendors: '/admin/vendors',
    staff: '/admin/staff',
    reports: '/admin/reports',
    notifications: '/admin/notifications',
  },
  staff: {
    dashboard: '/staff',
    customerSales: '/staff/customer-sales',
    appointments: '/staff/appointments',
    salesInvoices: '/staff/sales-invoices',
    customerReports: '/staff/customer-reports',
  },
  customer: {
    dashboard: '/customer',
    vehicles: '/customer/vehicles',
    bookAppointment: '/customer/book-appointment',
    partRequests: '/customer/part-requests',
    history: '/customer/history',
    reviews: '/customer/reviews',
    profile: '/customer/profile',
  },
} as const

const pageMetaEntries: Array<{ path: string; meta: PageMeta }> = [
  {
    path: ROUTE_PATHS.adminLogin,
    meta: {
      title: 'Admin Login',
      subtitle: 'Restricted administrator access for seeded accounts.',
    },
  },
  {
    path: ROUTE_PATHS.admin.dashboard,
    meta: {
      title: 'Admin Dashboard',
      subtitle: 'Monitor inventory, finance, and critical alerts.',
    },
  },
  {
    path: ROUTE_PATHS.admin.inventory,
    meta: {
      title: 'Inventory',
      subtitle: 'Track stock levels, parts, and replenishment work.',
    },
  },
  {
    path: ROUTE_PATHS.admin.vendors,
    meta: {
      title: 'Vendors',
      subtitle: 'Maintain supplier relationships and procurement flow.',
    },
  },
  {
    path: ROUTE_PATHS.admin.staff,
    meta: {
      title: 'Staff Management',
      subtitle: 'Review staff access, roles, and internal assignments.',
    },
  },
  {
    path: ROUTE_PATHS.admin.reports,
    meta: {
      title: 'Reports',
      subtitle: 'Review sales, customer, and operational reporting.',
    },
  },
  {
    path: ROUTE_PATHS.admin.notifications,
    meta: {
      title: 'Notifications',
      subtitle: 'Check low-stock and overdue credit reminders.',
    },
  },
  {
    path: ROUTE_PATHS.staff.dashboard,
    meta: {
      title: 'Staff Dashboard',
      subtitle: 'Handle sales, appointments, and customer follow-up.',
    },
  },
  {
    path: ROUTE_PATHS.staff.customerSales,
    meta: {
      title: 'Sales Invoices',
      subtitle: 'Create, review, and send part sales invoices.',
    },
  },
  {
    path: ROUTE_PATHS.staff.appointments,
    meta: {
      title: 'Appointments',
      subtitle: 'Manage booked services and workshop schedules.',
    },
  },
  {
    path: ROUTE_PATHS.staff.salesInvoices,
    meta: {
      title: 'Sales Invoices',
      subtitle: 'Create, review, and send part sales invoices.',
    },
  },
  {
    path: ROUTE_PATHS.staff.customerReports,
    meta: {
      title: 'Customer Reports',
      subtitle: 'Identify regular customers, high spenders, and credits.',
    },
  },
  {
    path: ROUTE_PATHS.customer.dashboard,
    meta: {
      title: 'Customer Dashboard',
      subtitle: 'Track your vehicles, services, and purchase history.',
    },
  },
  {
    path: ROUTE_PATHS.customer.vehicles,
    meta: {
      title: 'My Vehicles',
      subtitle: 'Manage registered vehicles linked to your account.',
    },
  },
  {
    path: ROUTE_PATHS.customer.bookAppointment,
    meta: {
      title: 'Appointments',
      subtitle: 'Review booked visits and request a new appointment.',
    },
  },
  {
    path: ROUTE_PATHS.customer.partRequests,
    meta: {
      title: 'Part Requests',
      subtitle: 'Request unavailable parts and monitor request status.',
    },
  },
  {
    path: ROUTE_PATHS.customer.history,
    meta: {
      title: 'History',
      subtitle: 'Review your past purchases and service records.',
    },
  },
  {
    path: ROUTE_PATHS.customer.reviews,
    meta: {
      title: 'Reviews',
      subtitle: 'Share service feedback and rating details.',
    },
  },
  {
    path: ROUTE_PATHS.customer.profile,
    meta: {
      title: 'Profile',
      subtitle: 'Review account details and contact information.',
    },
  },
  {
    path: ROUTE_PATHS.login,
    meta: {
      title: 'Sign In',
      subtitle: 'Use your VehiStock credentials to access the system.',
    },
  },
  {
    path: ROUTE_PATHS.register,
    meta: {
      title: 'Customer Registration',
      subtitle: 'Create a customer account for self-service and history access.',
    },
  },
  {
    path: ROUTE_PATHS.home,
    meta: {
      title: 'Welcome',
      subtitle: 'Vehicle parts, workshop flow, and customer self-service.',
    },
  },
]

export function getPageMeta(pathname: string) {
  return (
    [...pageMetaEntries]
      .sort((left, right) => right.path.length - left.path.length)
      .find(({ path }) =>
        path === '/'
          ? pathname === '/'
          : pathname === path || pathname.startsWith(`${path}/`),
      )?.meta ?? pageMetaEntries.at(-1)!.meta
  )
}

export function getDefaultPathForRole(role: UserRole) {
  switch (role) {
    case ROLE_NAMES.admin:
      return ROUTE_PATHS.admin.dashboard
    case ROLE_NAMES.staff:
      return ROUTE_PATHS.staff.dashboard
    case ROLE_NAMES.customer:
      return ROUTE_PATHS.customer.dashboard
    default:
      return ROUTE_PATHS.login
  }
}
