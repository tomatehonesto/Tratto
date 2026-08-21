import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { user, loading, configured, signIn } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Splash />

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setSubmitting(false)
    }
    // Em caso de sucesso o redirect acontece via mudança de sessão.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
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

        <h1 className="text-[20px] font-semibold tracking-tight">Entrar na plataforma</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Acesso restrito a usuários cadastrados pela sua imobiliária.
        </p>

        {!configured && (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-[#f59e0b33] bg-warning-soft px-3.5 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#b45309]" />
            <div className="text-[12px] leading-relaxed text-[#92400e]">
              <strong className="font-semibold">Autenticação não configurada.</strong> Defina{' '}
              <code className="font-mono">VITE_SUPABASE_URL</code> e{' '}
              <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> no ambiente.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!configured || submitting}
              className="h-10 w-full rounded-lg bg-input-background px-3 text-[14px] outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              placeholder="voce@imobiliaria.com.br"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!configured || submitting}
                className="h-10 w-full rounded-lg bg-input-background px-3 pr-10 text-[14px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-[#b91c1c]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="h-10 w-full"
            disabled={!configured || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" /> Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        <p className="mt-6 text-[12px] leading-relaxed text-muted-foreground">
          Esqueceu a senha ou precisa de acesso? Fale com o administrador da sua conta.
        </p>
      </div>
    </div>
  )
}

export function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}
