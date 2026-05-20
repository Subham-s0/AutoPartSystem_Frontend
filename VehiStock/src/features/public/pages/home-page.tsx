import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  CalendarCheck2,
  ChartColumnBig,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Mail,
  Package2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'

interface TrustItem {
  icon: LucideIcon
  label: string
}

interface MetricCard {
  label: string
  value: string
  detail: string
}

interface ProductModule {
  title: string
  description: string
  icon: LucideIcon
}

interface PortalCard {
  title: string
  description: string
  icon: LucideIcon
  accentClass: string
  entryLabel: string
  entryPath: string
  signals: string[]
}

interface OutcomeCard {
  title: string
  description: string
  icon: LucideIcon
}

const trustItems: TrustItem[] = [
  { icon: ShieldCheck, label: 'Role-based access' },
  { icon: ReceiptText, label: 'Invoice and credit visibility' },
  { icon: Package2, label: 'Stock-aware operations' },
  { icon: Users, label: 'Connected customer history' },
]

const operatingMetrics: MetricCard[] = [
  {
    label: 'Counter sales tracked',
    value: 'Rs 128,400',
    detail: 'A daily snapshot of part sales, balances, and collected payments.',
  },
  {
    label: 'Workshop queue',
    value: '24 jobs',
    detail: 'Appointments, incoming service work, and ongoing customer follow-up.',
  },
  {
    label: 'Low stock signals',
    value: '08 parts',
    detail: 'Items approaching replenishment before they become missed sales.',
  },
  {
    label: 'Pending credit',
    value: 'Rs 42,150',
    detail: 'Outstanding balances surfaced clearly for staff and management.',
  },
]

const productModules: ProductModule[] = [
  {
    title: 'Customer operations',
    description:
      'Keep customer records, vehicles, visits, invoices, and payments connected instead of scattered.',
    icon: Users,
  },
  {
    title: 'Parts and inventory',
    description:
      'Track stock, highlight low inventory, and support purchasing decisions with fewer surprises.',
    icon: Package2,
  },
  {
    title: 'Appointments and service',
    description:
      'Move from request to workshop follow-through with scheduling, history, and service context in one flow.',
    icon: CalendarCheck2,
  },
  {
    title: 'Reports and follow-up',
    description:
      'Spot high spenders, pending credits, and recurring customers without manually piecing reports together.',
    icon: ChartColumnBig,
  },
]

const portalCards: PortalCard[] = [
  {
    title: 'Admin portal',
    description:
      'For access control, customer visibility, stock oversight, reporting, and operational accountability.',
    icon: ShieldCheck,
    accentClass: 'bg-sky-50 text-sky-800',
    entryLabel: 'Admin login',
    entryPath: ROUTE_PATHS.adminLogin,
    signals: ['Staff roles', 'Customer records', 'Inventory and alerts'],
  },
  {
    title: 'Staff workspace',
    description:
      'For desk operations, customer handling, invoice creation, appointments, and day-to-day follow-up.',
    icon: BriefcaseBusiness,
    accentClass: 'bg-amber-50 text-amber-800',
    entryLabel: 'Staff login',
    entryPath: `${ROUTE_PATHS.login}?role=staff`,
    signals: ['Sales invoices', 'Customer lookup', 'Reports and credits'],
  },
  {
    title: 'Customer portal',
    description:
      'For self-service access to vehicles, appointments, requests, invoices, payment history, and reviews.',
    icon: UserRound,
    accentClass: 'bg-[var(--vs-green-100)] text-[var(--vs-green-800)]',
    entryLabel: 'Create account',
    entryPath: ROUTE_PATHS.register,
    signals: ['Vehicles', 'Appointments', 'History and payments'],
  },
]

const outcomeCards: OutcomeCard[] = [
  {
    title: 'Reduce missed follow-up',
    description:
      'Keep customer history, due balances, and service context available when staff actually need it.',
    icon: Mail,
  },
  {
    title: 'Make stock problems visible earlier',
    description:
      'Low-stock visibility helps the team react before demand turns into dead ends at the counter.',
    icon: TriangleAlert,
  },
  {
    title: 'Shorten invoice handling time',
    description:
      'Sales, payment details, and customer linkage stay in one workflow instead of being copied between tools.',
    icon: CreditCard,
  },
  {
    title: 'Give management better signal',
    description:
      'Customer reports and operational snapshots surface what needs attention without extra manual reporting.',
    icon: CircleDollarSign,
  },
]

function NavLink({
  to,
  children,
}: {
  to: string
  children: React.ReactNode
}) {
  return (
    <Link
      className="text-sm font-medium text-[var(--vs-muted)] transition hover:text-[var(--vs-text)]"
      to={to}
    >
      {children}
    </Link>
  )
}

function PreviewMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-xl border border-[var(--vs-border)] bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vs-muted)]">
        {label}
      </div>
      <div className={`mt-2 text-lg font-semibold ${tone}`}>{value}</div>
    </div>
  )
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--vs-border)] bg-white shadow-[0_24px_80px_rgba(17,24,17,0.08)]">
      <div className="flex items-center justify-between border-b border-[var(--vs-border)] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--vs-text)]">
            Operations snapshot
          </div>
          <div className="text-xs text-[var(--vs-muted)]">
            Sales, appointments, customer activity, and alerts in one place.
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--vs-green-100)] px-3 py-1 text-xs font-semibold text-[var(--vs-green-800)]">
          <Sparkles size={14} />
          Live workspace feel
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PreviewMetric
              label="Invoices today"
              value="14 completed"
              tone="text-[var(--vs-green-800)]"
            />
            <PreviewMetric
              label="Credits due"
              value="3 accounts"
              tone="text-amber-700"
            />
          </div>

          <div className="rounded-xl border border-[var(--vs-border)] bg-[var(--vs-bg)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Weekly activity</div>
                <div className="text-xs text-[var(--vs-muted)]">
                  Counter sales and workshop intake trend
                </div>
              </div>
              <ChartColumnBig size={18} className="text-[var(--vs-green-800)]" />
            </div>

            <div className="mt-5 flex h-32 items-end gap-2">
              {[58, 72, 66, 84, 79, 102, 88].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-md ${
                      index >= 5 ? 'bg-[var(--vs-green-800)]' : 'bg-[var(--vs-green-100)]'
                    }`}
                    style={{ height }}
                  />
                  <span className="text-[10px] font-medium text-[var(--vs-muted)]">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--vs-border)] bg-[var(--vs-bg)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ReceiptText size={16} className="text-[var(--vs-green-800)]" />
              Recent invoice activity
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['INV-2043', 'Brake pad set x2', 'Paid'],
                ['INV-2044', 'Oil filter + engine oil', 'Partial'],
                ['INV-2045', 'Battery replacement', 'Credit'],
              ].map(([invoice, item, status]) => (
                <div
                  key={invoice}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--vs-border)] bg-white px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{invoice}</div>
                    <div className="truncate text-xs text-[var(--vs-muted)]">{item}</div>
                  </div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      status === 'Paid'
                        ? 'bg-[var(--vs-green-100)] text-[var(--vs-green-800)]'
                        : status === 'Partial'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--vs-border)] bg-[var(--vs-bg)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BellRing size={16} className="text-[var(--vs-green-800)]" />
              Alerts needing attention
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['Brake pad set below minimum', 'Inventory'],
                ['Credit overdue for 31 days', 'Finance'],
                ['Customer appointment awaiting confirmation', 'Workshop'],
              ].map(([title, type]) => (
                <div
                  key={title}
                  className="rounded-lg border border-[var(--vs-border)] bg-white px-3 py-3"
                >
                  <div className="text-sm font-medium">{title}</div>
                  <div className="mt-1 text-xs text-[var(--vs-muted)]">{type}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--vs-border)] bg-[var(--vs-bg)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users size={16} className="text-[var(--vs-green-800)]" />
              Customer lookup
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['Suman Thapa', 'BA-2-CHA-1234', '2 invoices pending history'],
                ['Aayusha Karki', 'BAGMATI-01-0099', 'Last visit 6 days ago'],
                ['Nabin Rai', 'NA-3-PA-6677', 'High spender account'],
              ].map(([name, vehicle, note]) => (
                <div
                  key={name}
                  className="rounded-lg border border-[var(--vs-border)] bg-white px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{name}</div>
                    <div className="rounded-full bg-[var(--vs-green-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vs-green-800)]">
                      Active
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-[var(--vs-text)]">{vehicle}</div>
                  <div className="mt-1 text-xs text-[var(--vs-muted)]">{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--vs-bg)] text-[var(--vs-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--vs-border)] bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--vs-green-800)] text-white">
              <Wrench size={18} />
            </div>
            <div>
              <div className="text-base font-semibold">VehiStock</div>
              <div className="text-xs text-[var(--vs-muted)]">
                Parts, workshop flow, and customer operations
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
            <NavLink to={ROUTE_PATHS.login}>Customer login</NavLink>
            <NavLink to={`${ROUTE_PATHS.login}?role=staff`}>Staff login</NavLink>
            <NavLink to={ROUTE_PATHS.adminLogin}>Admin login</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[var(--vs-border)] px-4 py-2 text-sm font-semibold text-[var(--vs-text)] transition hover:border-[var(--vs-green-600)] hover:text-[var(--vs-green-800)]"
              to={ROUTE_PATHS.register}
            >
              Create account
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--vs-green-800)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--vs-green-900)]"
              to={ROUTE_PATHS.login}
            >
              Enter portal
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--vs-border)] bg-[linear-gradient(180deg,#f4f8f4_0%,#ffffff_100%)]">
          <div className="mx-auto max-w-7xl px-5 pb-14 pt-14 sm:px-6 lg:px-10 lg:pb-20 lg:pt-18">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--vs-border)] bg-white px-3.5 py-1.5 text-xs font-semibold uppercase text-[var(--vs-green-800)] shadow-sm">
                  <BadgeCheck size={14} />
                  Built for auto parts and service operations
                </div>

                <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
                  A cleaner way to run the sales counter, workshop desk, and customer history.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--vs-muted)] md:text-lg">
                  VehiStock gives auto parts and service teams one operational system
                  for customer records, vehicles, appointments, invoices, inventory,
                  and reporting so daily work feels coordinated instead of improvised.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--vs-green-800)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--vs-green-900)]"
                    to={ROUTE_PATHS.login}
                  >
                    Sign in to VehiStock
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-[var(--vs-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--vs-text)] transition hover:border-[var(--vs-green-600)] hover:text-[var(--vs-green-800)]"
                    to={ROUTE_PATHS.register}
                  >
                    Customer registration
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {trustItems.map((item) => (
                    <div
                      key={item.label}
                      className="inline-flex items-center gap-3 rounded-xl border border-[var(--vs-border)] bg-white px-4 py-3 text-sm font-medium shadow-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--vs-green-100)] text-[var(--vs-green-800)]">
                        <item.icon size={15} />
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <ProductPreview />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase text-[var(--vs-green-800)]">
              What teams track here
            </div>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
              The first page should already feel like real operational software.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--vs-muted)]">
              These are the signals the business actually cares about across the
              front desk, parts counter, and workshop workflow.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {operatingMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-[var(--vs-border)] bg-white p-5 shadow-sm"
              >
                <div className="text-xs font-semibold uppercase text-[var(--vs-muted)]">
                  {metric.label}
                </div>
                <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
                <p className="mt-2 text-sm leading-6 text-[var(--vs-muted)]">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-[var(--vs-border)] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr]">
              <div>
                <div className="text-sm font-semibold uppercase text-[var(--vs-green-800)]">
                  Product surface
                </div>
                <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                  Organized around the work, not around disconnected modules.
                </h2>
                <p className="mt-4 text-base leading-7 text-[var(--vs-muted)]">
                  VehiStock connects the same customer, vehicle, invoice, and stock
                  context across the roles that touch them, which is what makes the
                  product actually useful in a busy operation.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {productModules.map((module) => (
                  <article
                    key={module.title}
                    className="rounded-xl border border-[var(--vs-border)] bg-[var(--vs-bg)] p-5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--vs-green-100)] text-[var(--vs-green-800)]">
                      <module.icon size={20} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{module.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--vs-muted)]">
                      {module.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase text-[var(--vs-green-800)]">
              Portal entry points
            </div>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
              Different roles enter different workflows, but they work from the same system.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--vs-muted)]">
              That separation makes the experience cleaner for each person without
              breaking the continuity of the underlying records.
            </p>
          </div>

          <div className="mt-10 grid gap-5 xl:grid-cols-3">
            {portalCards.map((portal) => (
              <article
                key={portal.title}
                className="rounded-xl border border-[var(--vs-border)] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${portal.accentClass}`}>
                    <portal.icon size={20} />
                  </div>
                  <Link
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--vs-green-800)] transition hover:text-[var(--vs-green-900)]"
                    to={portal.entryPath}
                  >
                    {portal.entryLabel}
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <h3 className="mt-4 text-xl font-semibold">{portal.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--vs-muted)]">
                  {portal.description}
                </p>

                <div className="mt-5 rounded-xl border border-[var(--vs-border)] bg-[var(--vs-bg)] p-4">
                  <div className="text-xs font-semibold uppercase text-[var(--vs-muted)]">
                    Primary signals
                  </div>
                  <ul className="mt-3 space-y-3">
                    {portal.signals.map((signal) => (
                      <li key={signal} className="flex gap-3 text-sm text-[var(--vs-text)]">
                        <ClipboardCheck
                          size={16}
                          className="mt-0.5 flex-shrink-0 text-[var(--vs-green-800)]"
                        />
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-[var(--vs-border)] bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-10">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold uppercase text-[var(--vs-green-800)]">
                Business impact
              </div>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Better software helps the team notice and act sooner.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--vs-muted)]">
                The value is not just storing data. It is keeping the next useful
                action visible across customer handling, stock movement, and payment follow-up.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {outcomeCards.map((outcome) => (
                <article
                  key={outcome.title}
                  className="rounded-xl border border-[var(--vs-border)] bg-[var(--vs-bg)] p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--vs-green-800)] shadow-sm">
                    <outcome.icon size={19} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{outcome.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--vs-muted)]">
                    {outcome.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(140deg,#173f25_0%,#1e7a46_52%,#2ea05e_100%)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 text-white sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-2xl">
              <div className="text-sm font-semibold uppercase text-white/72">
                Start from the right portal
              </div>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Ready to move from scattered records to one operational system?
              </h2>
              <p className="mt-4 text-base leading-7 text-white/78">
                Customers can register for self-service access, staff can enter the
                day-to-day workspace, and administrators can step into oversight and reporting.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--vs-green-800)] transition hover:bg-white/92"
                to={ROUTE_PATHS.login}
              >
                Customer and staff login
                <ArrowRight size={14} />
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
                to={ROUTE_PATHS.adminLogin}
              >
                Admin portal
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
