import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/app/layouts/admin-layout'
import { CustomerLayout } from '@/app/layouts/customer-layout'
import { PublicLayout } from '@/app/layouts/public-layout'
import { StaffLayout } from '@/app/layouts/staff-layout'
import { ROUTE_PATHS } from '@/app/config/routes'
import { ROLE_NAMES } from '@/constants/roles'
import { ProtectedRoute } from './protected-route'
import { RoleRoute } from './role-route'
import { AdminDashboardPage } from '@/features/dashboard/pages/admin/admin-dashboard-page'
import { AdminAnalyticsPage } from '@/features/dashboard/pages/admin/admin-analytics-page'
import { AdminPartRequestsPage } from '@/features/dashboard/pages/admin/admin-part-requests-page'
import { InventoryPage } from '@/features/inventory/pages/admin/inventory-page'
import { PurchaseInvoicesPage } from '@/features/purchase-invoices/pages/admin/purchase-invoices-page'
import { NotificationsPage } from '@/features/notifications/pages/admin/notifications-page'
import { ReportsPage } from '@/features/reports/pages/admin/reports-page'
import { StaffPage } from '@/features/staff-management/pages/admin/staff-page'
import { VendorPage } from '@/features/vendors/pages/admin/vendor-page'
import { VendorFormPage } from '@/features/vendors/pages/admin/vendor-form-page'
import { CustomerDashboardPage } from '@/features/dashboard/pages/customer/customer-dashboard-page'
import { BookAppointmentPage } from '@/features/appointments/pages/customer/book-appointment-page'
import { CustomerHistoryPage } from '@/features/history/pages/customer/history-page'
import { ServiceHistoryDetailPage } from '@/features/history/pages/customer/service-history-detail-page'
import { CustomerServiceInvoicesPage } from '@/features/service-invoices/pages/customer/customer-service-invoices-page'
import { ServiceInvoicePaymentCallbackPage } from '@/features/payments/pages/customer/service-invoice-payment-callback-page'
import { CustomerNotificationsPage } from '@/features/notifications/pages/customer/customer-notifications-page'
import { CustomerPaymentsPage } from '@/features/payments/pages/customer/customer-payments-page'
import { PartRequestsPage } from '@/features/part-requests/pages/customer/part-requests-page'
import { ProfilePage } from '@/features/profile/pages/customer/profile-page'
import { VehicleDetailsPage } from '@/features/vehicles/pages/customer/vehicle-details-page'
import { ReviewsPage } from '@/features/reviews/pages/customer/reviews-page'
import { VehiclesPage } from '@/features/vehicles/pages/customer/vehicles-page'
import { HomePage } from '@/features/public/pages/home-page'
import { AdminLoginPage } from '@/features/auth/pages/admin-login-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { NotFoundPage } from '@/features/public/pages/not-found-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page'
import { AppointmentsPage } from '@/features/appointments/pages/staff/appointments-page'
import { CustomerReportsPage } from '@/features/reports/pages/staff/customer-reports-page'
import { SalesInvoicesPage } from '@/features/sales-invoices/pages/staff/sales-invoices-page'
import { StaffDashboardPage } from '@/features/dashboard/pages/staff/staff-dashboard-page'
import { StaffCustomersPage } from '@/features/customers/pages/staff/staff-customers-page'
import { StaffServiceRecordsPage } from '@/features/service-records/pages/staff/staff-service-records-page'

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
        <Route
          path="forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="reset-password"
          element={<ResetPasswordPage />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={[ROLE_NAMES.admin]} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="purchase-invoices" element={<PurchaseInvoicesPage />} />
            <Route path="vendors" element={<VendorPage />} />
            <Route path="vendors/new" element={<VendorFormPage />} />
            <Route path="vendors/:vendorId/edit" element={<VendorFormPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="customers" element={<StaffCustomersPage />} />
            <Route path="part-requests" element={<AdminPartRequestsPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[ROLE_NAMES.staff]} />}>
          <Route path="staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboardPage />} />
            <Route
              path="customer-sales"
              element={<Navigate replace to={ROUTE_PATHS.staff.salesInvoices} />}
            />
            <Route path="customers" element={<StaffCustomersPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="sales-invoices" element={<SalesInvoicesPage />} />
            <Route path="service-records" element={<StaffServiceRecordsPage />} />
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
            <Route path="vehicles/new" element={<VehicleDetailsPage />} />
            <Route path="vehicles/:vehicleId" element={<VehicleDetailsPage />} />
            <Route
              path="book-appointment"
              element={<BookAppointmentPage />}
            />
            <Route path="part-requests" element={<PartRequestsPage />} />
            <Route path="service-invoices" element={<CustomerServiceInvoicesPage />} />
            <Route
              path="service-invoices/payment/callback"
              element={<ServiceInvoicePaymentCallbackPage />}
            />
            <Route path="payments" element={<CustomerPaymentsPage />} />
            <Route
              path="notifications"
              element={<CustomerNotificationsPage />}
            />
            <Route path="history" element={<CustomerHistoryPage />} />
            <Route
              path="history/services/:serviceRecordId"
              element={<ServiceHistoryDetailPage />}
            />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
