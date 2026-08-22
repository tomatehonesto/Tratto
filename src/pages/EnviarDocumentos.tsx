import { useCallback, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Upload, Check, Loader2, ShieldCheck, AlertTriangle, FileText } from 'lucide-react'
import { fetchInvite, uploadDocumento } from '@/data/convites'
import type { InviteDetails } from '@/data/convites'
import { useQuery } from '@/hooks/useQuery'
import { docGroups } from '@/data/documentos'
import type { DocItem } from '@/data/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Página pública: quem abre não tem conta nem sessão. Todo acesso é validado
 * pelo token da URL, no banco. Nada aqui depende de estar logado.
 */
export default function EnviarDocumentos() {
  const { token } = useParams<{ token: string }>()
  const fetcher = useCallback(() => fetchInvite(token ?? ''), [token])
  const { data, loading, error, reload } = useQuery(fetcher)

  if (loading) return <Centro><Loader2 className="size-5 animate-spin text-muted-foreground" /></Centro>

  if (error) {
    return (
      <Centro>
        <Aviso tone="danger" titulo="Não foi possível carregar" texto={error} />
      </Centro>
    )
  }

  if (!data) {
    return (
      <Centro>
        <Aviso
          tone="danger"
          titulo="Link inválido ou expirado"
          texto="Este link não é mais válido. Peça um novo à imobiliária responsável pelo negócio."
        />
      </Centro>
    )
  }

  return <Portal invite={data} token={token ?? ''} onReload={reload} />
}

function Portal({
  invite,
  token,
  onReload,
}: {
  invite: InviteDetails
  token: string
  onReload: () => void
}) {
  // A lista exigida vem do mesmo guia usado na plataforma.
  const grupo = docGroups.find((g) =>
    invite.party_side === 'buyer' ? g.label === 'Comprador' : g.label === 'Vendedor',
  )
  const exigidos = grupo?.items.filter((i) => i.requirement !== 'OPCIONAL') ?? []
  const enviados = new Set(invite.documents.map((d) => d.name))

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-[16px] font-bold text-primary-foreground">
            T
          </span>
          <div>
            <p className="text-[17px] font-semibold leading-tight tracking-tight">Tratto</p>
            <p className="text-[12px] text-muted-foreground">{invite.organization}</p>
          </div>
        </div>

        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
          Olá, {invite.party_name.split(' ')[0]}
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
          Você consta como <strong className="font-medium text-foreground">{invite.party_role}</strong>{' '}
          na documentação do imóvel{' '}
          <strong className="font-medium text-foreground">{invite.address}</strong>
          {invite.city ? `, ${invite.city}` : ''}.
        </p>

        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#047857]" />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Seus arquivos vão direto para a {invite.organization} em armazenamento privado. Só a
            equipe responsável pelo negócio consegue abri-los. Este link é pessoal — não o repasse.
          </p>
        </div>

        <p className="mt-4 text-[12px] text-muted-foreground">
          Link válido até {formatDate(invite.expires_at.slice(0, 10))}.
        </p>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Documentos solicitados
            </h2>
            <span className="text-[13px] tabular-nums text-muted-foreground">
              {exigidos.filter((d) => enviados.has(d.name)).length}/{exigidos.length}
            </span>
          </div>

          <div className="space-y-2">
            {exigidos.map((item) => (
              <LinhaDocumento
                key={item.name}
                item={item}
                token={token}
                enviado={enviados.has(item.name)}
                onEnviado={onReload}
              />
            ))}
          </div>
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-muted-foreground">
          PDF, JPG, PNG ou HEIC, até 10 MB por arquivo. Em caso de dúvida, procure a{' '}
          {invite.organization}.
        </p>
      </div>
    </div>
  )
}

function LinhaDocumento({
  item,
  token,
  enviado,
  onEnviado,
}: {
  item: DocItem
  token: string
  enviado: boolean
  onEnviado: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setErro(null)
    setEnviando(true)
    try {
      await uploadDocumento(token, item.name, file)
      onEnviado()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha no envio.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3.5 transition-colors',
        enviado ? 'border-[#10b98133] bg-success-soft' : 'border-border bg-card',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[14px] font-medium">{item.name}</p>
            {item.requirement === 'CONDICIONAL' && (
              <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#b45309]">
                Se aplicável
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          {item.when && (
            <p className="mt-1 text-[12px] text-muted-foreground">
              <span className="font-medium">Quando:</span> {item.when}
            </p>
          )}
          {erro && <p className="mt-2 text-[12px] text-[#b91c1c]">{erro}</p>}
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/heic"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className={cn(
              'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4',
              enviado
                ? 'bg-card text-[#047857] hover:bg-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {enviando ? (
              <>
                <Loader2 className="animate-spin" /> Enviando
              </>
            ) : enviado ? (
              <>
                <Check /> Enviado
              </>
            ) : (
              <>
                <Upload /> Enviar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  )
}

function Aviso({
  tone,
  titulo,
  texto,
}: {
  tone: 'danger' | 'warning'
  titulo: string
  texto: string
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-5 py-4',
        tone === 'danger' ? 'border-[#ef444433] bg-danger-soft' : 'border-[#f59e0b33] bg-warning-soft',
      )}
    >
      <AlertTriangle
        className={cn('mt-0.5 size-4 shrink-0', tone === 'danger' ? 'text-[#b91c1c]' : 'text-[#b45309]')}
      />
      <div>
        <p className={cn('text-[14px] font-semibold', tone === 'danger' ? 'text-[#b91c1c]' : 'text-[#b45309]')}>
          {titulo}
        </p>
        <p className={cn('mt-1 text-[13px] leading-relaxed', tone === 'danger' ? 'text-[#991b1b]' : 'text-[#92400e]')}>
          {texto}
        </p>
      </div>
    </div>
  )
}
