import {
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  Search,
  ShieldCheck,
  Star,
  Users,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'

/* ── Role feature data ────────────────────────── */

interface RoleFeature {
  icon: LucideIcon
  text: string
}

const adminFeatures: RoleFeature[] = [
  { icon: Users, text: 'Register and manage staff accounts' },
  { icon: Package, text: 'Add, edit, or delete vehicle parts' },
  { icon: Briefcase, text: 'Handle vendor details and procurement' },
  { icon: FileText, text: 'Create purchase invoices from vendors' },
  { icon: ClipboardList, text: 'Auto-generated financial and inventory reports' },
  { icon: Warehouse, text: 'Full inventory overview and stock control' },
]

const staffFeatures: RoleFeature[] = [
  { icon: Users, text: 'Register customers and record vehicle details' },
  { icon: CreditCard, text: 'Handle part sales and create invoices' },
  { icon: Search, text: 'Search customers by name, phone, ID, or vehicle' },
  { icon: FileText, text: 'Access customer purchase and vehicle history' },
  { icon: ClipboardList, text: 'Generate customer-focused reports' },
  { icon: CreditCard, text: 'Track top spenders and overdue credits' },
]

const customerFeatures: RoleFeature[] = [
  { icon: Users, text: 'Self-register and manage your profile' },
  { icon: CalendarDays, text: 'Book service appointments online' },
  { icon: Star, text: 'Submit service reviews and feedback' },
  { icon: Package, text: 'Request unavailable parts' },
  { icon: ClipboardList, text: 'View complete service and purchase history' },
]

/* ── Platform highlights ──────────────────────── */

const platformHighlights = [
  {
    title: 'Low stock alerts',
    description:
      'Automatic admin notification when any part stock drops below 10 units.',
    icon: Bell,
  },
  {
    title: 'Credit reminders',
    description:
      'Email reminders to customers with unpaid credit balances overdue by more than one month.',
    icon: CreditCard,
  },
  {
    title: 'Invoice and email automation',
    description:
      'Staff can create and email invoices directly to customers, keeping financial records accurate and accessible.',
    icon: FileText,
  },
]

/* ── Feature list component ───────────────────── */

function FeatureList({ features }: { features: RoleFeature[] }) {
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li
          key={feature.text}
          className="flex items-start gap-3 text-sm leading-6 text-[var(--vs-text)]"
        >
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--vs-green-100)] text-[var(--vs-green-800)]">
            <feature.icon size={14} />
          </div>
          {feature.text}
        </li>
      ))}
    </ul>
  )
}

/* ── Page component ───────────────────────────── */

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--vs-bg)]">
      {/* ── Navbar ──────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-[var(--vs-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--vs-green-800)] text-white">
              <Wrench size={18} />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--vs-text)]">
                VehiStock
              </div>
              <div className="text-[11px] text-[var(--vs-muted)]">
                Vehicle Parts Selling &amp; Inventory Management
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="rounded-full border border-[var(--vs-border)] px-4 py-2 text-sm font-medium text-[var(--vs-text)] transition hover:border-[var(--vs-green-600)] hover:text-[var(--vs-green-800)]"
              to={ROUTE_PATHS.register}
            >
              Customer Sign Up
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-[var(--vs-green-800)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--vs-green-900)]"
              to={ROUTE_PATHS.login}
            >
              Login
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* ── Hero ──────────────────────────── */}
        <section className="pb-16 pt-16 md:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--vs-border)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--vs-green-800)] shadow-sm">
              <ShieldCheck size={14} />
              Role-based access for admin, staff, and customers
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-[var(--vs-text)] md:text-5xl lg:text-6xl">
              Vehicle parts, service scheduling, and operations{' '}
              <span className="text-[var(--vs-green-800)]">
                in one platform.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--vs-muted)] md:text-lg">
              VehiStock streamlines operations for vehicle service and parts
              retail centers. It manages inventory, vendor relationships,
              customer history, appointments, and invoices — all under one
              role-aware system.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-[var(--vs-green-800)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--vs-green-900)]"
                to={ROUTE_PATHS.login}
              >
                Login to VehiStock
                <ArrowRight size={15} />
              </Link>
              <Link
                className="rounded-full border border-[var(--vs-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--vs-text)] shadow-sm transition hover:border-[var(--vs-green-600)] hover:text-[var(--vs-green-800)]"
                to={ROUTE_PATHS.register}
              >
                Create Customer Account
              </Link>
            </div>
          </div>
        </section>

        {/* ── Role cards ───────────────────── */}
        <section className="pb-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--vs-text)] md:text-3xl">
              Three roles, one unified system
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--vs-muted)]">
              Each user role has tailored functionalities to improve efficiency,
              customer service, and ensure smooth inventory and financial
              management.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Admin */}
            <article className="flex flex-col rounded-2xl border border-[var(--vs-border)] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e3f2fd] text-[#0c447c]">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--vs-text)]">
                    Admin
                  </h3>
                  <p className="text-xs text-[var(--vs-muted)]">
                    Full system control
                  </p>
                </div>
              </div>
              <p className="mb-5 text-sm leading-6 text-[var(--vs-muted)]">
                The admin has the highest level of control — managing staff,
                vendors, inventory, purchase invoices, and auto-generated
                financial reports for informed decision-making.
              </p>
              <FeatureList features={adminFeatures} />
            </article>

            {/* Staff */}
            <article className="flex flex-col rounded-2xl border border-[var(--vs-border)] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e1] text-[#854f0b]">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--vs-text)]">
                    Staff
                  </h3>
                  <p className="text-xs text-[var(--vs-muted)]">
                    Customer-facing operations
                  </p>
                </div>
              </div>
              <p className="mb-5 text-sm leading-6 text-[var(--vs-muted)]">
                Staff interact directly with customers — registering them,
                recording vehicles, handling sales, creating invoices, and
                generating customer-focused reports.
              </p>
              <FeatureList features={staffFeatures} />
            </article>

            {/* Customer */}
            <article className="flex flex-col rounded-2xl border border-[var(--vs-border)] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--vs-green-100)] text-[var(--vs-green-800)]">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--vs-text)]">
                    Customer
                  </h3>
                  <p className="text-xs text-[var(--vs-muted)]">
                    Self-service portal
                  </p>
                </div>
              </div>
              <p className="mb-5 text-sm leading-6 text-[var(--vs-muted)]">
                Customers self-register, book appointments, request parts,
                submit reviews, and view their complete service and purchase
                history from one self-service portal.
              </p>
              <FeatureList features={customerFeatures} />
            </article>
          </div>
        </section>

        {/* ── Platform highlights ───────────── */}
        <section className="pb-16">
          <div className="rounded-2xl border border-[var(--vs-border)] bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-2 text-xl font-semibold tracking-[-0.02em] text-[var(--vs-text)]">
              Smart automation built in
            </h2>
            <p className="mb-8 max-w-lg text-sm leading-6 text-[var(--vs-muted)]">
              VehiStock automates critical workflows so nothing falls through
              the cracks.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {platformHighlights.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--vs-green-100)] text-[var(--vs-green-800)]">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--vs-text)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--vs-muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer CTA ───────────────────── */}
        <section className="pb-16">
          <div className="flex flex-col items-center rounded-2xl bg-[linear-gradient(160deg,#173f25_0%,#1e7a46_52%,#87b948_100%)] px-8 py-12 text-center text-white shadow-sm">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
              Ready to streamline your operations?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/75">
              Get started by creating a customer account or logging in to your
              admin or staff portal.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--vs-green-800)] transition hover:bg-white/90"
                to={ROUTE_PATHS.login}
              >
                Login
                <ArrowRight size={14} />
              </Link>
              <Link
                className="rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                to={ROUTE_PATHS.register}
              >
                Create Customer Account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
