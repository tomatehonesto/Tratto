import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Loader2, MailCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthShell, TextField, FormError, Splash } from '@/components/auth/AuthShell'
import { useAuth } from '@/contexts/AuthContext'

export default function Cadastro() {
  const { user, loading, configured, signUp } = useAuth()

  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  if (loading) return <Splash />
  if (user) return <Navigate to="/" replace />

  if (sent) {
    return (
      <AuthShell
        title="Confirme seu email"
        description={
          <>
            Enviamos um link de confirmação para{' '}
            <strong className="font-medium text-foreground">{email}</strong>. Abra o link para ativar
            a conta e entrar na plataforma.
          </>
        }
        footer={
          <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
            Voltar para o login
          </Link>
        }
      >
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-[#047857]" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Não recebeu? Verifique a caixa de spam. O link expira em algumas horas.
          </p>
        </div>
      </AuthShell>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Use uma senha de pelo menos 8 caracteres.')
      return
    }

    setSubmitting(true)
    const result = await signUp({ name, organizationName, email, password })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    if (result.needsConfirmation) {
      setSent(true)
      return
    }
    // Sem confirmação de email a sessão já vem pronta e o redirect é automático.
  }

  return (
    <AuthShell
      title="Cadastre sua imobiliária"
      description="Você entra como administrador da conta e convida a equipe depois."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
            Entrar
          </Link>
        </>
      }
    >
      {!configured && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-[#f59e0b33] bg-warning-soft px-3.5 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#b45309]" />
          <div className="text-[12px] leading-relaxed text-[#92400e]">
            <strong className="font-semibold">Autenticação não configurada.</strong>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <TextField
          id="name"
          label="Seu nome"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!configured || submitting}
          placeholder="Maria Silva"
        />

        <TextField
          id="organization"
          label="Imobiliária"
          autoComplete="organization"
          required
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          disabled={!configured || submitting}
          placeholder="Imobiliária Silva"
          hint="Se sua imobiliária já usa a Tratto, peça um convite ao administrador em vez de criar outra conta."
        />

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

        <TextField
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!configured || submitting}
          hint="Mínimo de 8 caracteres."
        />

        {error && <FormError>{error}</FormError>}

        <Button type="submit" variant="primary" className="h-10 w-full" disabled={!configured || submitting}>
          {submitting ? (
            <>
              <Loader2 className="animate-spin" /> Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}
