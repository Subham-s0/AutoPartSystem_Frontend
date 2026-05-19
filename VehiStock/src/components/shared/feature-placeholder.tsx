import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface FeaturePlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
  notes?: string[]
  actions?: ReactNode
}

export function FeaturePlaceholder({
  icon: Icon,
  title,
  description,
  notes = [],
  actions,
}: FeaturePlaceholderProps) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--vs-border)] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--vs-green-100)] text-[var(--vs-green-800)]">
            <Icon size={20} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--vs-text)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--vs-muted)]">
            {description}
          </p>
          {notes.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-[var(--vs-text)]">
              {notes.map((note) => (
                <li key={note} className="flex items-start gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-[var(--vs-green-700)]" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  )
}
