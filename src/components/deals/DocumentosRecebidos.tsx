import { useState } from 'react'
import {
  FileText,
  Download,
  Check,
  Clock,
  Send,
  MailCheck,
  Eye,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import type { DealDetail, DealParticipant } from '@/data/api'
import { urlAssinada, enviarConvite } from '@/data/convites'
import { docGroups } from '@/data/documentos'
import type { DocItem } from '@/data/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DocumentosRecebidos({
  data,
  organizationName,
  onReload,
}: {
  data: DealDetail
  organizationName: string
  onReload: () => void
}) {
  const partes = data.participants.filter((p) => p.side !== 'team')

  if (partes.length === 0) {
    return (
      <Card>
        <CardBody className="py-16 text-center text-[13px] text-muted-foreground">
          Este negócio não tem partes cadastradas.
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {partes.map((p) => (
        <ParteDocumentos
          key={p.id ?? p.name}
          parte={p}
          imovel={data.deal.address}
          organizationName={organizationName}
          onReload={onReload}
        />
      ))}
    </div>
  )
}

function ParteDocumentos({
  parte,
  imovel,
  organizationName,
  onReload,
}: {
  parte: DealParticipant
  imovel: string
  organizationName: string
  onReload: () => void
}) {
  const [reenviando, setReenviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  // A lista exigida é a mesma que a parte vê no portal.
  const grupo = docGroups.find((g) =>
    parte.side === 'buyer' ? g.label === 'Comprador' : g.label === 'Vendedor',
  )
  const exigidos = grupo?.items.filter((i) => i.requirement !== 'OPCIONAL') ?? []
  const recebidosPorNome = new Map(parte.documents.map((d) => [d.docName, d]))
  const recebidos = exigidos.filter((e) => recebidosPorNome.has(e.name)).length

  // Enviados que não estão na lista exigida — a parte pode ter mandado extras.
  const extras = parte.documents.filter((d) => !exigidos.some((e) => e.name === d.docName))

  async function reenviar() {
    if (!parte.invite || !parte.email) return
    setAviso(null)
    setReenviando(true)
    const r = await enviarConvite({
      token: parte.invite.token,
      nome: parte.name,
      email: parte.email,
      papel: parte.role,
      imovel,
      imobiliaria: organizationName,
    })
    setAviso(r.ok ? 'Convite reenviado.' : `Não foi possível reenviar: ${r.erro}`)
    setReenviando(false)
    if (r.ok) onReload()
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2.5">
            <Avatar initials={parte.initials} size={28} />
            {parte.name}
          </span>
        }
        description={`${parte.role}${parte.email ? ` · ${parte.email}` : ''}`}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[13px] tabular-nums text-muted-foreground">
              {recebidos}/{exigidos.length}
            </span>
            {parte.invite && parte.email && (
              <Button variant="outline" size="sm" onClick={() => void reenviar()} disabled={reenviando}>
                {reenviando ? <Loader2 className="animate-spin" /> : <Send />}
                Reenviar
              </Button>
            )}
          </div>
        }
      />

      <CardBody className="border-b border-border py-3">
        <Progress
          value={exigidos.length ? (recebidos / exigidos.length) * 100 : 0}
          tone={recebidos === exigidos.length ? 'success' : recebidos > 0 ? 'warning' : 'danger'}
        />
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <StatusConvite parte={parte} />
        </div>
        {aviso && (
          <p
            className={cn(
              'mt-2 text-[12px]',
              aviso.startsWith('Convite reenviado') ? 'text-[#047857]' : 'text-[#b45309]',
            )}
          >
            {aviso}
          </p>
        )}
      </CardBody>

      <ul className="divide-y divide-border">
        {exigidos.map((item) => (
          <LinhaDoc key={item.name} item={item} recebido={recebidosPorNome.get(item.name)} />
        ))}
        {extras.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Check className="size-4 shrink-0 text-[#10b981]" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{d.docName}</p>
                <p className="text-[12px] text-muted-foreground">
                  Enviado em {formatDate(d.uploadedAt.slice(0, 10))} · fora da lista exigida
                </p>
              </div>
            </div>
            <BotaoAbrir path={d.storagePath} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function StatusConvite({ parte }: { parte: DealParticipant }) {
  if (!parte.invite) return <span>Sem convite gerado.</span>

  const expirado = new Date(parte.invite.expiresAt) < new Date()

  return (
    <>
      <span className="flex items-center gap-1.5">
        <MailCheck className="size-3.5" />
        {parte.invite.sentAt
          ? `Convite enviado em ${formatDate(parte.invite.sentAt.slice(0, 10))}`
          : 'Convite ainda não enviado'}
      </span>
      <span className="flex items-center gap-1.5">
        <Eye className="size-3.5" />
        {parte.invite.firstOpenedAt
          ? `Aberto em ${formatDate(parte.invite.firstOpenedAt.slice(0, 10))}`
          : 'Ainda não aberto'}
      </span>
      <span className={cn('flex items-center gap-1.5', expirado && 'text-[#b91c1c]')}>
        {expirado ? <AlertTriangle className="size-3.5" /> : <Clock className="size-3.5" />}
        {expirado
          ? 'Link expirado'
          : `Válido até ${formatDate(parte.invite.expiresAt.slice(0, 10))}`}
      </span>
    </>
  )
}

function LinhaDoc({
  item,
  recebido,
}: {
  item: DocItem
  recebido?: { storagePath: string; uploadedAt: string; sizeBytes: number | null }
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {recebido ? (
          <Check className="size-4 shrink-0 text-[#10b981]" />
        ) : (
          <FileText className="size-4 shrink-0 text-muted-foreground/50" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('text-[13px]', recebido ? 'font-medium' : 'text-muted-foreground')}>
              {item.name}
            </p>
            {item.requirement === 'CONDICIONAL' && <Badge tone="warning">Condicional</Badge>}
          </div>
          {recebido ? (
            <p className="text-[12px] text-muted-foreground">
              Recebido em {formatDate(recebido.uploadedAt.slice(0, 10))}
              {recebido.sizeBytes ? ` · ${formatarTamanho(recebido.sizeBytes)}` : ''}
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground">Aguardando envio</p>
          )}
        </div>
      </div>

      {recebido ? (
        <BotaoAbrir path={recebido.storagePath} />
      ) : (
        <Badge>Pendente</Badge>
      )}
    </li>
  )
}

function BotaoAbrir({ path }: { path: string }) {
  const [abrindo, setAbrindo] = useState(false)
  const [erro, setErro] = useState(false)

  async function abrir() {
    setErro(false)
    setAbrindo(true)
    try {
      const url = await urlAssinada(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setErro(true)
    } finally {
      setAbrindo(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void abrir()} disabled={abrindo}>
      {abrindo ? <Loader2 className="animate-spin" /> : <Download />}
      {erro ? 'Falhou' : 'Abrir'}
    </Button>
  )
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
