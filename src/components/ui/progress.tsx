import { cn } from '@/lib/utils'

export function Progress({
  value,
  tone = 'info',
  className,
}: {
  value: number
  tone?: 'info' | 'success' | 'warning' | 'danger'
  className?: string
}) {
  const bar = {
    info: 'bg-chart-1',
    success: 'bg-chart-2',
    warning: 'bg-chart-3',
    danger: 'bg-chart-4',
  }[tone]

  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', bar)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
