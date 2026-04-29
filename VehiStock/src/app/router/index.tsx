import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/app/layouts/admin-layout'
import { CustomerLayout } from '@/app/layouts/customer-layout'
import { PublicLayout } from '@/app/layouts/public-layout'
import { StaffLayout } from '@/app/layouts/staff-layout'
import { ROUTE_PATHS } from '@/app/config/routes'
import { ROLE_NAMES } from '@/constants/roles'
import { ProtectedRoute } from './protected-route'
import { RoleRoute } from './role-route'
import { AdminDashboardPage } from '@/pages/admin/admin-dashboard-page'
import { InventoryPage } from '@/pages/admin/inventory-page'
import { NotificationsPage } from '@/pages/admin/notifications-page'
import { ReportsPage } from '@/pages/admin/reports-page'
import { StaffPage } from '@/pages/admin/staff-page'
import { VendorPage } from '@/pages/admin/vendor-page'
import { CustomerDashboardPage } from '@/pages/customer/customer-dashboard-page'
import { BookAppointmentPage } from '@/pages/customer/book-appointment-page'
import { CustomerHistoryPage } from '@/pages/customer/history-page'
import { PartRequestsPage } from '@/pages/customer/part-requests-page'
import { ProfilePage } from '@/pages/customer/profile-page'
import { ReviewsPage } from '@/pages/customer/reviews-page'
import { VehiclesPage } from '@/pages/customer/vehicles-page'
import { HomePage } from '@/pages/public/home-page'
import { AdminLoginPage } from '@/pages/public/admin-login-page'
import { LoginPage } from '@/pages/public/login-page'
import { NotFoundPage } from '@/pages/public/not-found-page'
import { RegisterPage } from '@/pages/public/register-page'
import { AppointmentsPage } from '@/pages/staff/appointments-page'
import { CustomerReportsPage } from '@/pages/staff/customer-reports-page'
import { SalesInvoicesPage } from '@/pages/staff/sales-invoices-page'
import { StaffDashboardPage } from '@/pages/staff/staff-dashboard-page'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={ROUTE_PATHS.login.slice(1)} element={<LoginPage />} />
        <Route
          path={ROUTE_PATHS.adminLogin.slice(1)}
          element={<AdminLoginPage />}
        />
        <Route
          path={ROUTE_PATHS.register.slice(1)}
          element={<RegisterPage />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={[ROLE_NAMES.admin]} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="vendors" element={<VendorPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLE_NAMES.staff]} />}>
          <Route path="staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboardPage />} />
            <Route
              path="customer-sales"
              element={<Navigate replace to={ROUTE_PATHS.staff.salesInvoices} />}
            />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="sales-invoices" element={<SalesInvoicesPage />} />
            <Route
              path="customer-reports"
              element={<CustomerReportsPage />}
            />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLE_NAMES.customer]} />}>
          <Route path="customer" element={<CustomerLayout />}>
            <Route index element={<CustomerDashboardPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route
              path="book-appointment"
              element={<BookAppointmentPage />}
            />
            <Route path="part-requests" element={<PartRequestsPage />} />
            <Route path="history" element={<CustomerHistoryPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
