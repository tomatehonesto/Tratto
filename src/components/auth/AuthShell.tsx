import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Moldura comum das telas de entrada e cadastro. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-[16px] font-bold text-primary-foreground">
            T
          </span>
          <div>
            <p className="text-[17px] font-semibold leading-tight tracking-tight">Tratto</p>
            <p className="text-[12px] text-muted-foreground">Due Diligence Imobiliária</p>
          </div>
        </div>

        <h1 className="text-[20px] font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>

        {children}

        {footer && <div className="mt-6 text-[13px] text-muted-foreground">{footer}</div>}
      </div>
    </div>
  )
}

export function TextField({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  // React 19 passa ref como prop comum; o tipo precisa declará-la.
  ref?: Ref<HTMLInputElement>
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-[13px] font-medium">
        {label}
      </label>
      <input
        className={cn(
          'h-10 w-full rounded-lg bg-input-background px-3 text-[14px] outline-none',
          'placeholder:text-muted-foreground disabled:opacity-60',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          className,
        )}
        {...props}
      />
      {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-[#b91c1c]">
      {children}
    </p>
  )
}

export function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}
