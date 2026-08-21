import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ScrollText,
  ShieldCheck,
  FileSignature,
  PenLine,
  Settings,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon }

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/negocios', label: 'Negócios', icon: Briefcase },
    ],
  },
  {
    title: 'Documentação',
    items: [
      { to: '/documentos', label: 'Documentos', icon: FileText },
      { to: '/certidoes', label: 'Certidões', icon: ScrollText },
      { to: '/auditoria', label: 'Auditoria', icon: ShieldCheck },
      { to: '/contratos', label: 'Contratos', icon: FileSignature },
      { to: '/assinaturas', label: 'Assinaturas', icon: PenLine },
    ],
  },
  {
    title: 'Configuração',
    items: [{ to: '/administracao', label: 'Administração', icon: Settings }],
  },
]

export function Sidebar() {
  const { displayUser, signOut } = useAuth()

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
          T
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Tratto</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn('size-4 shrink-0', isActive ? 'text-sidebar-primary' : 'text-current')}
                        />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3.5">
        <Avatar initials={displayUser?.initials ?? '?'} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-tight">
            {displayUser?.name ?? 'Usuário'}
          </p>
          <p className="truncate text-[12px] text-muted-foreground">{displayUser?.role}</p>
        </div>
        <button
          onClick={() => void signOut()}
          aria-label="Sair da plataforma"
          title="Sair"
          className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  )
}
