import { cn } from '@/lib/utils'
import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-[13px]', className)} {...props} />
    </div>
  )
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-border px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-border px-5 py-3 align-middle', className)} {...props} />
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors last:[&>td]:border-0 hover:bg-[#fafaff]', className)} {...props} />
}
