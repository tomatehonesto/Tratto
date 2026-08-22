import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Check, Circle, Clock, Mail, FileText } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { UnderlineTabs } from '@/components/ui/tabs'
import { Table, Th, Td, Tr } from '@/components/ui/table'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states'
import { fetchDealDetail } from '@/data/api'
import type { DealDetail } from '@/data/api'
import { buildPipeline, countConcluidas } from '@/data/pipeline'
import type { PipelineStep } from '@/data/pipeline'
import { useQuery } from '@/hooks/useQuery'
import {
  dealTone,
  progressTone,
  certidaoTone,
  contractTone,
  signatureTone,
  verdictTone,
} from '@/lib/status'
import { formatCurrency, formatDate, formatCost } from '@/lib/format'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'certidoes', label: 'Certidões' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'participantes', label: 'Participantes' },
  { value: 'historico', label: 'Histórico' },
]

export default function NegocioDetalhe() {
  const { reference } = useParams<{ reference: string }>()
  const [tab, setTab] = useState('overview')

  // A referência vem da URL sem o '#', que é o fragmento da própria URL.
  const ref = `#${reference ?? ''}`
  const fetcher = useCallback(() => fetchDealDetail(ref), [ref])
  const { data, loading, error, reload } = useQuery(fetcher)

  if (loading) return <LoadingState label="Carregando negócio..." />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) {
    return (
      <>
        <VoltarLink />
        <EmptyState message={`Negócio ${ref} não encontrado.`} />
      </>
    )
  }

  const { deal } = data

  return (
    <>
      <VoltarLink />

      <Card className="mb-6">
        <CardBody className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] text-muted-foreground">{deal.id}</span>
              <Badge tone={dealTone[deal.status]} dot>
                {deal.status}
              </Badge>
              <Badge>{deal.type}</Badge>
            </div>
            <h1 className="mt-2 text-[20px] font-semibold leading-tight tracking-tight">
              {deal.address}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
              <MapPin className="size-3.5" />
              {[deal.district, deal.city].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[22px] font-semibold tabular-nums">
              {formatCurrency(deal.value)}
              {deal.recurring && (
                <span className="text-[13px] font-normal text-muted-foreground"> /mês</span>
              )}
            </p>
            <div className="mt-2 flex items-center justify-end gap-2 text-[12px] text-muted-foreground">
              <span className="tabular-nums">{deal.progress}%</span>
              <span>·</span>
              <span>{deal.stage}</span>
            </div>
            <Progress
              value={deal.progress}
              tone={progressTone(deal.progress)}
              className="mt-2 w-[180px]"
            />
          </div>
        </CardBody>
      </Card>

      <div className="mb-6">
        <UnderlineTabs items={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && <Overview data={data} />}
      {tab === 'certidoes' && <Certidoes data={data} />}
      {tab === 'contrato' && <Contrato data={data} />}
      {tab === 'participantes' && <Participantes data={data} />}
      {tab === 'historico' && <Historico data={data} />}
    </>
  )
}

function VoltarLink() {
  return (
    <Link
      to="/negocios"
      className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" /> Negócios
    </Link>
  )
}

function Overview({ data }: { data: DealDetail }) {
  const steps = buildPipeline(data.deal.stage, data.certidoes, data.contract, data.signatures)
  const { done, total } = countConcluidas(steps)

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="col-span-2">
        <CardHeader
          title="Checklist do negócio"
          description="Derivado da etapa atual e do que já existe no negócio"
          action={
            <span className="text-[13px] font-semibold tabular-nums">
              {done}/{total}
            </span>
          }
        />
        <ul className="divide-y divide-border">
          {steps.map((s) => (
            <StepRow key={s.label} step={s} />
          ))}
        </ul>
      </Card>

      <div className="space-y-4">
        {data.audit && (
          <Card>
            <CardHeader
              title="Auditoria"
              action={
                <Badge tone={verdictTone[data.audit.verdict]} dot>
                  {data.audit.verdict}
                </Badge>
              }
            />
            <CardBody className="space-y-3">
              {data.audit.groups.map((g) => (
                <div key={g.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{g.label}</span>
                    <span className="tabular-nums">
                      {g.done}/{g.total}
                    </span>
                  </div>
                  <Progress
                    value={(g.done / g.total) * 100}
                    tone={progressTone((g.done / g.total) * 100)}
                  />
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Informações" />
          <CardBody>
            <dl className="divide-y divide-border text-[13px]">
              <Info label="Criado em" value={formatDate(data.createdAt)} />
              <Info label="Última atualização" value={formatDate(data.deal.updatedAt)} />
              <Info label="Responsável" value={data.deal.owner.name} />
              <Info label="Certidões" value={`${data.certidoes.length}`} />
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function StepRow({ step }: { step: PipelineStep }) {
  const icon = {
    concluido: <Check className="size-3.5 text-[#10b981]" />,
    andamento: <Clock className="size-3.5 text-[#f59e0b]" />,
    pendente: <Circle className="size-3 text-muted-foreground/40" />,
  }[step.state]

  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>
      <span
        className={
          step.state === 'pendente'
            ? 'flex-1 text-[13px] text-muted-foreground'
            : 'flex-1 text-[13px]'
        }
      >
        {step.label}
      </span>
      {step.detail && <span className="text-[12px] text-muted-foreground">{step.detail}</span>}
      {step.optional && <Badge>Opcional</Badge>}
      {step.state === 'andamento' && !step.detail && <Badge tone="warning">Em andamento</Badge>}
    </li>
  )
}

function Certidoes({ data }: { data: DealDetail }) {
  if (data.certidoes.length === 0) {
    return <EmptyState message="Nenhuma certidão solicitada para este negócio." />
  }

  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Certidão</Th>
            <Th>Origem</Th>
            <Th>Órgão</Th>
            <Th>Solicitada</Th>
            <Th>Validade</Th>
            <Th className="text-right">Custo</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {data.certidoes.map((c) => (
            <Tr key={c.id}>
              <Td className="font-medium">{c.name}</Td>
              <Td className="text-muted-foreground">{c.origin}</Td>
              <Td className="text-muted-foreground">{c.agency}</Td>
              <Td className="text-muted-foreground">{formatDate(c.requestedAt)}</Td>
              <Td className={c.status === 'Vencida' ? 'font-medium text-[#b91c1c]' : 'text-muted-foreground'}>
                {formatDate(c.validUntil)}
              </Td>
              <Td className="text-right tabular-nums text-muted-foreground">{formatCost(c.cost)}</Td>
              <Td>
                <Badge tone={certidaoTone[c.status]} dot>
                  {c.status}
                </Badge>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function Contrato({ data }: { data: DealDetail }) {
  if (!data.contract) {
    return <EmptyState message="Nenhum contrato gerado para este negócio." />
  }

  const c = data.contract

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Contrato de {c.type}
            </span>
          }
          action={
            <Badge tone={contractTone[c.status]} dot>
              {c.status}
            </Badge>
          }
        />
        <CardBody>
          <dl className="divide-y divide-border text-[13px]">
            <Info label="Versão" value={c.version ?? '—'} />
            <Info label="Responsável" value={c.owner?.name ?? '—'} />
            <Info label="Última edição" value={formatDate(c.updatedAt)} />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Assinaturas" description={`${data.signatures.length} signatários`} />
        {data.signatures.length === 0 ? (
          <CardBody className="py-10 text-center text-[13px] text-muted-foreground">
            Contrato ainda não enviado para assinatura.
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Signatário</Th>
                <Th>Papel</Th>
                <Th>Enviado em</Th>
                <Th>Prazo</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.signatures.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar initials={s.initials} size={28} />
                      <span className="min-w-0">
                        <p className="font-medium leading-tight">{s.name}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{s.email}</p>
                      </span>
                    </span>
                  </Td>
                  <Td className="text-muted-foreground">{s.role}</Td>
                  <Td className="text-muted-foreground">{formatDate(s.sentAt)}</Td>
                  <Td className="text-muted-foreground">{formatDate(s.deadline)}</Td>
                  <Td>
                    <Badge tone={signatureTone[s.status]} dot>
                      {s.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

const sideLabel = {
  buyer: 'Parte compradora',
  seller: 'Parte vendedora',
  team: 'Equipe',
} as const

function Participantes({ data }: { data: DealDetail }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {data.participants.map((p) => (
        <Card key={`${p.side}-${p.name}`}>
          <CardBody>
            <div className="flex items-start gap-3">
              <Avatar initials={p.initials} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight">{p.name}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{p.role}</p>
              </div>
            </div>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {sideLabel[p.side]}
            </p>

            {p.email ? (
              <a
                href={`mailto:${p.email}`}
                className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{p.email}</span>
              </a>
            ) : (
              <p className="mt-2 text-[13px] text-muted-foreground">Sem email cadastrado</p>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function Historico({ data }: { data: DealDetail }) {
  if (data.activities.length === 0) {
    return <EmptyState message="Nenhuma atividade registrada neste negócio." />
  }

  return (
    <Card>
      <ul className="divide-y divide-border">
        {data.activities.map((a, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium">{a.title}</p>
                <Badge>{a.kind}</Badge>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Badge tone={dealTone[a.status]}>{a.status}</Badge>
              <p className="mt-1 text-[12px] text-muted-foreground">{a.at}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
