import { Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    // h-screen (não min-h-screen) trava a moldura na altura da viewport, e a
    // rolagem passa a acontecer dentro do <main>. Assim a sidebar fica parada
    // em vez de sair de vista junto com o documento.
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-[1400px] px-8 py-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[13px] text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  )
}
