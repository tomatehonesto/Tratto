import { useMemo, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Stat } from '@/components/ui/stat'
import { Tabs } from '@/components/ui/tabs'
import { PageHeader, SectionTitle } from '@/components/layout/AppLayout'
import { audits, checklistModels } from '@/data/auditoria'
import { verdictTone, progressTone } from '@/lib/status'

const TYPE_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'Compra e Venda', label: 'Compra e Venda' },
  { value: 'Locação', label: 'Locação' },
  { value: 'Permuta', label: 'Permuta' },
]

export default function Auditoria() {
  const [type, setType] = useState('todos')

  const visible = useMemo(
    () => (type === 'todos' ? audits : audits.filter((a) => a.type === type)),
    [type],
  )

  const approved = audits.filter((a) => a.verdict === 'Aprovado').length
  const attention = audits.filter((a) => a.verdict === 'Atenção').length
  const blockers = audits.filter((a) => a.verdict === 'Bloqueador').length

  return (
    <>
      <PageHeader
        title="Auditoria Jurídica"
        description="Conformidade documental e checklist por modelo de negócio"
      />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Stat label="Negócios auditados" value={audits.length} />
        <Stat label="Aprovados" value={approved} hintTone="success" />
        <Stat label="Com pendências" value={attention} hintTone="warning" />
        <Stat label="Bloqueadores" value={blockers} hintTone="danger" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <Tabs items={TYPE_FILTERS} value={type} onChange={setType} />
        <span className="text-[13px] text-muted-foreground">
          {visible.length} negócio{visible.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4">
        {visible.map((a) => {
          const done = a.groups.reduce((s, g) => s + g.done, 0)
          const total = a.groups.reduce((s, g) => s + g.total, 0)
          const pct = Math.round((done / total) * 100)

          return (
            <Card key={a.dealId}>
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-muted-foreground">{a.dealId}</span>
                    <Badge>{a.type}</Badge>
                  </div>
                  <h3 className="mt-1.5 text-[14px] font-semibold leading-snug">{a.address}</h3>
                  <p className="text-[12px] text-muted-foreground">{a.city}</p>
                </div>
                <Badge tone={verdictTone[a.verdict]} dot>
                  {a.verdict}
                </Badge>
              </div>

              <CardBody className="space-y-3">
                {a.groups.map((g) => (
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

              <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[16px] font-semibold tabular-nums">{pct}%</span>
                  <span className="text-[12px] text-muted-foreground">
                    {done}/{total} documentos
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  Ver relatório <ArrowRight />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <SectionTitle>Checklists padrão por modelo</SectionTitle>
      <p className="mb-4 -mt-2 text-[13px] text-muted-foreground">
        Certidões exigidas por tipo de operação — base para auditoria de cada negócio
      </p>

      <div className="grid grid-cols-3 gap-4">
        {checklistModels.map((m) => (
          <Card key={m.model}>
            <CardHeader
              title={m.model}
              action={
                <div className="flex flex-col items-end gap-1">
                  <Badge tone="info">{m.required} obrig.</Badge>
                  <Badge>{m.optional} opcion.</Badge>
                </div>
              }
            />
            <CardBody className="space-y-4">
              {m.groups.map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {g.label}
                  </p>
                  <ul className="space-y-1.5">
                    {g.items.map((it) => (
                      <li key={it.label} className="flex items-start gap-2 text-[13px]">
                        <Check
                          className="mt-0.5 size-3.5 shrink-0"
                          style={{ color: it.optional ? 'var(--muted-foreground)' : 'var(--chart-2)' }}
                        />
                        <span className="min-w-0">
                          {it.label}
                          {it.note && (
                            <span className="text-[12px] text-muted-foreground"> ({it.note})</span>
                          )}
                          {it.optional && (
                            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              opcional
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  )
}
