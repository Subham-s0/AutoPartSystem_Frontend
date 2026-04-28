import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@/app/config/routes'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-[var(--vs-border)] bg-white p-10 text-center shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--vs-green-800)]">
          404
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--vs-text)]">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--vs-muted)]">
          The route you opened does not exist in the current frontend structure.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-[var(--vs-border)] px-5 py-3 text-sm font-semibold text-[var(--vs-text)] transition hover:border-[var(--vs-green-600)]"
            to={ROUTE_PATHS.home}
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
