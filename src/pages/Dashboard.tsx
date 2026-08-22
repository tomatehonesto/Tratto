import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Briefcase,
  PenLine,
  AlertTriangle,
  CheckCircle2,
  ScrollText,
  FileText,
  FileSignature,
  ArrowRight,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stat } from '@/components/ui/stat'
import { Progress } from '@/components/ui/progress'
import { Table, Th, Td, Tr } from '@/components/ui/table'
import { LoadingState, ErrorState } from '@/components/ui/states'
import { NovoNegocioModal } from '@/components/deals/NovoNegocioModal'
import { VolumeChart } from '@/components/charts/VolumeChart'
import { PageHeader, SectionTitle } from '@/components/layout/AppLayout'
import {
  fetchDeals,
  fetchPendencies,
  fetchActivities,
  fetchCertidoes,
  fetchContracts,
  fetchMonthlyVolume,
} from '@/data/api'
import { useQuery } from '@/hooks/useQuery'
// Contadores do guia de documentação — conteúdo de referência, fora do banco.
import { docCountsByType } from '@/data/documentos'
import { useAuth } from '@/contexts/AuthContext'
import { dealTone, progressTone, contractTone } from '@/lib/status'
import { formatToday, greeting } from '@/lib/format'

const kindTone = {
  Contrato: 'info',
  Auditoria: 'info',
  Certidão: 'success',
  Documento: 'neutral',
} as const

/** Uma chamada só, para o dashboard não disparar seis requisições em cascata. */
async function fetchDashboard() {
  const [deals, pendencies, activities, certidoes, contracts, volume] = await Promise.all([
    fetchDeals(),
    fetchPendencies(),
    fetchActivities(),
    fetchCertidoes(),
    fetchContracts(),
    fetchMonthlyVolume(),
  ])
  return { deals, pendencies, activities, certidoes, contracts, volume }
}

export default function Dashboard() {
  const { displayUser } = useAuth()
  const firstName = displayUser?.name.split(' ')[0] ?? 'bem-vindo'

  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)

  const fetcher = useCallback(fetchDashboard, [])
  const { data, loading, error, reload } = useQuery(fetcher)

  const stats = useMemo(() => {
    if (!data) return null
    const { deals, pendencies, certidoes } = data
    return {
      activeDeals: deals.filter((d) => d.status === 'Em andamento').length,
      awaitingSignature: deals.filter((d) => d.status === 'Aguard. assinatura').length,
      blocked: deals.filter((d) => d.status === 'Bloqueado').length,
      completed: deals.filter((d) => d.status === 'Concluído').length,
      urgent: pendencies.filter((p) => p.priority === 'Alta').length,
      received: certidoes.filter((c) => c.status === 'Recebida').length,
      inProgress: certidoes.filter((c) => c.status === 'Solicitada').length,
      pendingCert: certidoes.filter((c) => c.status === 'Pendente').length,
      expired: certidoes.filter((c) => c.status === 'Vencida').length,
    }
  }, [data])

  /** Pipeline por tipo, derivado dos negócios reais. */
  const pipeline = useMemo(() => {
    const types = ['Compra e Venda', 'Locação', 'Auditoria', 'Permuta'] as const
    return types.map((label) => ({
      label,
      count: data?.deals.filter((d) => d.type === label).length ?? 0,
    }))
  }, [data])

  if (error) {
    return (
      <>
        <PageHeader eyebrow={formatToday()} title={`${greeting()}, ${firstName}. 👋`} />
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={formatToday()}
        title={`${greeting()}, ${firstName}. 👋`}
        description={
          stats ? (
            <>
              Você tem{' '}
              <strong className="font-semibold text-foreground">
                {stats.urgent} pendência{stats.urgent === 1 ? '' : 's'} urgente{stats.urgent === 1 ? '' : 's'}
              </strong>{' '}
              e{' '}
              <strong className="font-semibold text-foreground">
                {stats.awaitingSignature} contrato{stats.awaitingSignature === 1 ? '' : 's'}
              </strong>{' '}
              aguardando assinatura.
            </>
          ) : (
            'Carregando seus indicadores...'
          )
        }
        action={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus /> Novo negócio
          </Button>
        }
      />

      <NovoNegocioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        organizationName={displayUser?.organizationName ?? 'sua imobiliária'}
        onCreated={() => {
          setModalOpen(false)
          // Leva para a lista, onde o negócio recém-criado fica visível.
          navigate('/negocios')
        }}
      />

      <SectionTitle>Negócios</SectionTitle>
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Stat label="Negócios ativos" value={stats?.activeDeals ?? '—'} icon={<Briefcase />} />
        <Stat label="Aguard. assinatura" value={stats?.awaitingSignature ?? '—'} hint="Ação necessária" hintTone="warning" icon={<PenLine />} />
        <Stat label="Bloqueados" value={stats?.blocked ?? '—'} hint="Requer atenção" hintTone="danger" icon={<AlertTriangle />} />
        <Stat label="Concluídos" value={stats?.completed ?? '—'} icon={<CheckCircle2 />} />
      </div>

      <SectionTitle>Certidões</SectionTitle>
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Stat label="Total" value={data?.certidoes.length ?? '—'} hint="Todos os negócios" icon={<ScrollText />} />
        <Stat label="Recebidas" value={stats?.received ?? '—'} hint="Válidas" hintTone="success" />
        <Stat label="Em andamento" value={stats ? stats.inProgress + stats.pendingCert : '—'} hint="Solicitadas" hintTone="warning" />
        <Stat label="Vencidas" value={stats?.expired ?? '—'} hint="Requerem ação" hintTone="danger" />
      </div>

      {loading || !data ? (
        <LoadingState label="Carregando dados da plataforma..." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader
                title="Negócios recentes"
                action={
                  <Link
                    to="/negocios"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Ver todos <ArrowRight className="size-3.5" />
                  </Link>
                }
              />
              <Table>
                <thead>
                  <tr>
                    <Th>Negócio</Th>
                    <Th>Etapa</Th>
                    <Th>Status</Th>
                    <Th className="w-[160px]">Progresso</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.deals.slice(0, 5).map((d) => (
                    <Tr key={d.id}>
                      <Td>
                        <span className="font-mono text-[12px] text-muted-foreground">{d.id}</span>
                        <p className="mt-0.5 font-medium">{d.address}</p>
                      </Td>
                      <Td className="text-muted-foreground">{d.stage}</Td>
                      <Td>
                        <Badge tone={dealTone[d.status]} dot>
                          {d.status}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Progress value={d.progress} tone={progressTone(d.progress)} className="flex-1" />
                          <span className="w-9 text-right text-[12px] tabular-nums text-muted-foreground">
                            {d.progress}%
                          </span>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            <Card>
              <CardHeader
                title="Pendências"
                description={`${data.pendencies.length} ${data.pendencies.length === 1 ? 'item requer' : 'itens requerem'} atenção`}
              />
              {data.pendencies.length === 0 ? (
                <CardBody className="py-10 text-center text-[13px] text-muted-foreground">
                  Nenhuma pendência aberta.
                </CardBody>
              ) : (
                <ul className="divide-y divide-border">
                  {data.pendencies.map((p) => (
                    <li key={`${p.dealId}-${p.title}`} className="flex items-start gap-3 px-5 py-3.5">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.priority === 'Alta' ? 'var(--danger)' : 'var(--warning)' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium leading-snug">{p.title}</p>
                        <p className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
                          <span className="font-mono">{p.dealId}</span>
                          <Badge tone={p.priority === 'Alta' ? 'danger' : 'warning'}>{p.priority}</Badge>
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader
                title="Volume mensal de atividades"
                description="Negócios, certidões e documentos — últimos 12 meses"
              />
              <CardBody>
                <VolumeChart data={data.volume} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Pipeline atual" description="Negócios por tipo" />
              <CardBody className="space-y-3.5">
                {pipeline.map((p) => {
                  const max = Math.max(...pipeline.map((x) => x.count), 1)
                  return (
                    <div key={p.label}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span>{p.label}</span>
                        <span className="tabular-nums text-muted-foreground">{p.count}</span>
                      </div>
                      <Progress value={(p.count / max) * 100} />
                    </div>
                  )
                })}
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader title="Atividades recentes" />
              {data.activities.length === 0 ? (
                <CardBody className="py-10 text-center text-[13px] text-muted-foreground">
                  Nenhuma atividade registrada.
                </CardBody>
              ) : (
                <ul className="divide-y divide-border">
                  {data.activities.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium">{a.title}</p>
                          <Badge tone={kindTone[a.kind]}>{a.kind}</Badge>
                        </div>
                        <p className="mt-1 truncate text-[12px] text-muted-foreground">
                          <span className="font-mono">{a.dealId}</span> · {a.address} · {a.city}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge tone={dealTone[a.status]}>{a.status}</Badge>
                        <p className="mt-1 text-[12px] text-muted-foreground">{a.at}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="space-y-4">
              <SectionTitle>Acesso rápido</SectionTitle>

              <Card>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" /> Documentos
                    </span>
                  }
                  action={
                    <Link to="/documentos" className="text-[12px] text-muted-foreground hover:text-foreground">
                      Ver guia
                    </Link>
                  }
                />
                <CardBody className="space-y-2 py-3">
                  {docCountsByType.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="tabular-nums">{d.count} docs</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <ScrollText className="size-4 text-muted-foreground" /> Certidões
                    </span>
                  }
                  action={
                    <Link to="/certidoes" className="text-[12px] text-muted-foreground hover:text-foreground">
                      Ver todas
                    </Link>
                  }
                />
                <CardBody className="space-y-2 py-3">
                  {[
                    { label: 'Recebidas', value: stats?.received ?? 0 },
                    { label: 'Em andamento', value: stats?.inProgress ?? 0 },
                    { label: 'Pendentes', value: stats?.pendingCert ?? 0 },
                    { label: 'Vencidas', value: stats?.expired ?? 0 },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="tabular-nums">{r.value}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <FileSignature className="size-4 text-muted-foreground" /> Contratos
                    </span>
                  }
                  action={
                    <Link to="/contratos" className="text-[12px] text-muted-foreground hover:text-foreground">
                      Ver todos
                    </Link>
                  }
                />
                <CardBody className="space-y-2.5 py-3">
                  {data.contracts.slice(0, 4).map((c) => (
                    <div key={c.dealId} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="min-w-0 truncate text-muted-foreground">{c.type}</span>
                      <Badge tone={contractTone[c.status]}>{c.status}</Badge>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  )
}
