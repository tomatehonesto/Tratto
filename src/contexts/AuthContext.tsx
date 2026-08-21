import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/** Usuário já normalizado para exibição na interface. */
export interface DisplayUser {
  name: string
  initials: string
  email: string
  role: string
}

interface AuthValue {
  user: User | null
  displayUser: DisplayUser | null
  /** `true` enquanto a sessão inicial ainda está sendo restaurada. */
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function toDisplayUser(user: User): DisplayUser {
  const meta = user.user_metadata ?? {}
  const email = user.email ?? ''
  // Cai para o trecho antes do @ quando o usuário não tem nome no metadata.
  const name = (meta.name as string) || (meta.full_name as string) || email.split('@')[0] || 'Usuário'
  return {
    name,
    initials: initialsFrom(name),
    email,
    role: (meta.role as string) || 'Usuário',
  }
}

/**
 * Traduz os erros do Supabase para mensagens úteis em português, sem
 * revelar se o email existe — o que ajudaria a enumerar contas.
 */
function translateError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Este email ainda não foi confirmado.'
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Não foi possível conectar ao servidor de autenticação.'
  }
  return 'Não foi possível entrar. Tente novamente.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null

  const value: AuthValue = {
    user,
    displayUser: user ? toDisplayUser(user) : null,
    loading,
    configured: isSupabaseConfigured,
    async signIn(email, password) {
      if (!supabase) return { error: 'Autenticação não configurada.' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? translateError(error.message) : null }
    },
    async signOut() {
      await supabase?.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
