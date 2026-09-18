import { useThemeStore, type ThemeMode } from '@/store/themeStore'

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
  { mode: 'system', label: 'System' },
]

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)

  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-0.5 text-xs font-medium">
      {OPTIONS.map((opt) => (
        <button
          key={opt.mode}
          type="button"
          onClick={() => setMode(opt.mode)}
          aria-pressed={mode === opt.mode}
          className={`rounded px-2 py-1 transition-colors ${
            mode === opt.mode ? 'bg-accent text-accent-contrast' : 'text-text-muted hover:text-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
