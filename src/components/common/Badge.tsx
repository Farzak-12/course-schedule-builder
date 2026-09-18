interface BadgeProps {
  count: number
}

/** Live "⚠ N clashes" pill shown next to non-selected what-if options. */
export function Badge({ count }: BadgeProps) {
  if (count <= 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-mono text-text-muted">
        ⚠ 0 clashes
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-clash-bg px-2 py-0.5 text-xs font-mono text-clash">
      ⚠ {count} {count === 1 ? 'clash' : 'clashes'}
    </span>
  )
}
