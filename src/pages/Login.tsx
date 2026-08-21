import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthShell, TextField, FormError, Splash } from '@/components/auth/AuthShell'
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
    <AuthShell
      title="Entrar na plataforma"
      description="Acesse os negócios da sua imobiliária."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-foreground underline underline-offset-2">
            Cadastre sua imobiliária
          </Link>
        </>
      }
    >
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
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!configured || submitting}
          placeholder="voce@imobiliaria.com.br"
        />

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

        {error && <FormError>{error}</FormError>}

        <Button type="submit" variant="primary" className="h-10 w-full" disabled={!configured || submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" /> Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
