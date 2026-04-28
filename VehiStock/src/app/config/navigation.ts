import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CarFront,
  ClipboardList,
  History,
  LayoutDashboard,
  ShoppingCart,
  User,
  UserCog,
  Warehouse,
  Wrench,
} from 'lucide-react'
import { ROLE_NAMES, type UserRole } from '@/constants/roles'
import { ROUTE_PATHS } from './routes'
import type { NavigationSection } from '@/types/common'

const adminNavigation: NavigationSection[] = [
  {
    title: 'Main',
    items: [
      {
        label: 'Dashboard',
        to: ROUTE_PATHS.admin.dashboard,
        icon: LayoutDashboard,
      },
      {
        label: 'Inventory',
        to: ROUTE_PATHS.admin.inventory,
        icon: Warehouse,
      },
      {
        label: 'Vendors',
        to: ROUTE_PATHS.admin.vendors,
        icon: Building2,
      },
    ],
  },
  {
    title: 'Manage',
    items: [
      {
        label: 'Staff',
        to: ROUTE_PATHS.admin.staff,
        icon: UserCog,
      },
      {
        label: 'Reports',
        to: ROUTE_PATHS.admin.reports,
        icon: BarChart3,
      },
      {
        label: 'Notifications',
        to: ROUTE_PATHS.admin.notifications,
        icon: Bell,
      },
    ],
  },
]

const staffNavigation: NavigationSection[] = [
  {
    title: 'Main',
    items: [
      {
        label: 'Dashboard',
        to: ROUTE_PATHS.staff.dashboard,
        icon: LayoutDashboard,
      },
      {
        label: 'Customer Sales',
        to: ROUTE_PATHS.staff.customerSales,
        icon: ShoppingCart,
      },
      {
        label: 'Appointments',
        to: ROUTE_PATHS.staff.appointments,
        icon: CalendarDays,
      },
    ],
  },
  {
    title: 'Work',
    items: [
      {
        label: 'Sales Invoices',
        to: ROUTE_PATHS.staff.salesInvoices,
        icon: ClipboardList,
      },
      {
        label: 'Customer Reports',
        to: ROUTE_PATHS.staff.customerReports,
        icon: BarChart3,
      },
    ],
  },
]

const customerNavigation: NavigationSection[] = [
  {
    title: 'Account',
    items: [
      {
        label: 'Dashboard',
        to: ROUTE_PATHS.customer.dashboard,
        icon: LayoutDashboard,
      },
      {
        label: 'Vehicles',
        to: ROUTE_PATHS.customer.vehicles,
        icon: CarFront,
      },
      {
        label: 'Book Appointment',
        to: ROUTE_PATHS.customer.bookAppointment,
        icon: CalendarDays,
      },
    ],
  },
  {
    title: 'History',
    items: [
      {
        label: 'Part Requests',
        to: ROUTE_PATHS.customer.partRequests,
        icon: Wrench,
      },
      {
        label: 'History',
        to: ROUTE_PATHS.customer.history,
        icon: History,
      },
      {
        label: 'Reviews',
        to: ROUTE_PATHS.customer.reviews,
        icon: Bell,
      },
      {
        label: 'Profile',
        to: ROUTE_PATHS.customer.profile,
        icon: User,
      },
    ],
  },
]

export function getNavigationForRole(role: UserRole) {
  switch (role) {
    case ROLE_NAMES.admin:
      return adminNavigation
    case ROLE_NAMES.staff:
      return staffNavigation
    case ROLE_NAMES.customer:
      return customerNavigation
    default:
      return []
  }
}
