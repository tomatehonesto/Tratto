import { cn } from '@/lib/utils'

export type TabItem = { value: string; label: string; count?: number }

/** Segmented control usado nos filtros de Negócios / Auditoria / Administração. */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[]
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              active ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(10,10,15,0.06)]' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span
                className={cn(
                  'rounded px-1.5 text-[11px] tabular-nums',
                  active ? 'bg-muted text-muted-foreground' : 'text-muted-foreground',
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Abas sublinhadas usadas na Administração. */
export function UnderlineTabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-6 border-b border-border">
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 pb-2.5 text-[13px] font-medium transition-colors',
              active
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
