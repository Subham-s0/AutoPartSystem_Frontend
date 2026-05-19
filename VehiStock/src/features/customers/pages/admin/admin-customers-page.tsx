import { CustomerDirectoryPage } from '@/features/customers/components/customer-directory-page'

export function AdminCustomersPage() {
  return (
    <CustomerDirectoryPage
      allowCreate
      description="Manage registered customers, inspect profile details, and review invoice or payment history from the admin side."
      scope="admin"
      title="Customer Directory"
    />
  )
}
