import type { PropsWithChildren, ReactNode } from 'react'

interface PageSectionProps extends PropsWithChildren {
  title: string
  description: string
  actions?: ReactNode
}

export function PageSection({
  title,
  description,
  actions,
  children,
}: PageSectionProps) {
  return (
    <section className="page-section">
      <div className="page-section-hdr">
        <div>
          <h2 className="page-section-title">{title}</h2>
          <p className="page-section-desc">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
