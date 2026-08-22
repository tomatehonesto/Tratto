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
  organizationName: string
}

interface AuthValue {
  user: User | null
  displayUser: DisplayUser | null
  /** `true` enquanto a sessão inicial ainda está sendo restaurada. */
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (input: SignUpInput) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

export interface SignUpInput {
  name: string
  organizationName: string
  email: string
  password: string
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function toDisplayUser(user: User, perfil: PerfilDb | null): DisplayUser {
  const meta = user.user_metadata ?? {}
  const email = user.email ?? ''
  // O perfil no banco é a fonte boa; o metadata cobre o instante entre entrar
  // e a consulta responder, e o trecho antes do @ é o último recurso.
  const name =
    perfil?.name || (meta.name as string) || (meta.full_name as string) || email.split('@')[0] || 'Usuário'
  return {
    name,
    initials: initialsFrom(name),
    email,
    role: perfil?.role || (meta.role as string) || 'Usuário',
    organizationName:
      perfil?.organizationName || (meta.organization_name as string) || 'sua imobiliária',
  }
}

interface PerfilDb {
  name: string
  role: string
  organizationName: string
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
  if (m.includes('signups not allowed')) {
    return 'O cadastro está desativado no momento.'
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Já existe uma conta com este email.'
  }
  if (m.includes('password') && m.includes('least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Email inválido.'
  }
  if (m.includes('sending') && m.includes('email')) {
    return 'A conta não pôde ser criada porque o email de confirmação não foi enviado. Verifique a configuração de SMTP.'
  }
  // Desconhecido: mostra o original em vez de esconder. Uma mensagem genérica
  // aqui custa um ciclo inteiro de depuração para descobrir o que já estava
  // escrito na resposta.
  return `Não foi possível concluir: ${message}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState<PerfilDb | null>(null)

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
  const userId = user?.id

  // Carrega o perfil real assim que há sessão. Falha aqui não bloqueia o app:
  // a interface cai para o metadata do usuário.
  useEffect(() => {
    if (!supabase || !userId) {
      setPerfil(null)
      return
    }
    let ativo = true
    supabase
      .from('profiles')
      .select('name, role, organizations(name)')
      .eq('auth_user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!ativo || !data) return
        const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations
        setPerfil({
          name: data.name as string,
          role: data.role as string,
          organizationName: (org as { name: string } | null)?.name ?? '',
        })
      })
    return () => {
      ativo = false
    }
  }, [userId])

  const value: AuthValue = {
    user,
    displayUser: user ? toDisplayUser(user, perfil) : null,
    loading,
    configured: isSupabaseConfigured,
    async signIn(email, password) {
      if (!supabase) return { error: 'Autenticação não configurada.' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? translateError(error.message) : null }
    },
    async signUp({ name, organizationName, email, password }) {
      if (!supabase) return { error: 'Autenticação não configurada.', needsConfirmation: false }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Lido pelo gatilho handle_new_user() para criar a organização e o
          // perfil Admin. Sem isso o usuário entra sem organização e vê tudo vazio.
          data: { name, organization_name: organizationName },
          // Sem isto o link de confirmação volta sempre para o Site URL do
          // projeto — quem se cadastra em produção cairia em localhost.
          // A origem precisa estar na allow-list de Redirect URLs do Supabase.
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) return { error: translateError(error.message), needsConfirmation: false }

      // Com confirmação de email ligada, o Supabase devolve usuário sem sessão.
      return { error: null, needsConfirmation: Boolean(data.user) && !data.session }
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
