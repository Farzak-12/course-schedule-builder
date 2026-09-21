import type { ReactNode } from 'react'

interface SidebarCardProps {
  title: string
  description?: string
  children: ReactNode
}

export function SidebarCard({ title, description, children }: SidebarCardProps) {
  return (
    <section className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      <div className="px-4 pt-3.5 pb-2.5">
        <h3 className="font-display text-base text-text">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  )
}
