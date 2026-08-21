import { cn } from '@/lib/utils'
import { Card } from './card'
import type { ReactNode } from 'react'

export function Stat({
  label,
  value,
  hint,
  hintTone = 'muted',
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  hintTone?: 'muted' | 'success' | 'warning' | 'danger'
  icon?: ReactNode
}) {
  const hintColor = {
    muted: 'text-muted-foreground',
    success: 'text-[#047857]',
    warning: 'text-[#b45309]',
    danger: 'text-[#b91c1c]',
  }[hintTone]

  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-[26px] font-semibold leading-none tabular-nums">{value}</p>
          {hint && <p className={cn('mt-1.5 text-[12px]', hintColor)}>{hint}</p>}
        </div>
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
    </Card>
  )
}
