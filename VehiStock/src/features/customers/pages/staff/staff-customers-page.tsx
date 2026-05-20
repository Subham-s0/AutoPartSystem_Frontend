import { CustomerDirectoryPage } from '@/features/customers/components/customer-directory-page'

export function StaffCustomersPage() {
  return (
    <CustomerDirectoryPage
      allowCreate
      description="Register customers, review their profile, and inspect invoice and payment activity without leaving the staff workspace."
      scope="staff"
      title="Customers"
    />
  )
}
