import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        className="h-9 w-full rounded-lg bg-input-background pl-9 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        {...props}
      />
    </div>
  )
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 cursor-pointer rounded-lg border border-border bg-card px-3 text-[13px] outline-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}
