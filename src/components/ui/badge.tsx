import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-info-soft text-[#4338ca]',
  success: 'bg-success-soft text-[#047857]',
  warning: 'bg-warning-soft text-[#b45309]',
  danger: 'bg-danger-soft text-[#b91c1c]',
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}
