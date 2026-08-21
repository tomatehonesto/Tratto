import { useMemo, useState } from 'react'
import { Download, Info, MapPin } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Select } from '@/components/ui/field'
import { PageHeader } from '@/components/layout/AppLayout'
import { docGroups, guideSummary, UFS, TRANSACTION_TYPES, MODALITIES } from '@/data/documentos'
import type { DocRequirement } from '@/data/types'

const requirementTone = {
  OBRIGATÓRIO: 'danger',
  CONDICIONAL: 'warning',
  OPCIONAL: 'neutral',
} as const

export default function Documentos() {
  const [type, setType] = useState<string>(TRANSACTION_TYPES[0])
  const [modality, setModality] = useState<string>(MODALITIES[0])
  const [uf, setUf] = useState('SP')

  const ufName = UFS.find((u) => u.uf === uf)?.name.split(' — ')[1] ?? uf

  const counts = useMemo(() => {
    const all = docGroups.flatMap((g) => g.items)
    const by = (r: DocRequirement) => all.filter((i) => i.requirement === r).length
    return {
      total: all.length,
      required: by('OBRIGATÓRIO'),
      conditional: by('CONDICIONAL'),
      optional: by('OPCIONAL'),
    }
  }, [])

  return (
    <>
      <PageHeader
        title="Documentos"
        description="Guia de documentação exigida por tipo de transação e estado"
        action={
          <Button variant="outline">
            <Download /> Exportar PDF
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs
          items={TRANSACTION_TYPES.map((t) => ({ value: t, label: t }))}
          value={type}
          onChange={setType}
        />
        <Tabs
          items={MODALITIES.map((m) => ({ value: m, label: m }))}
          value={modality}
          onChange={setModality}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">Estado:</span>
          <Select value={uf} onChange={(e) => setUf(e.target.value)}>
            {UFS.map((u) => (
              <option key={u.uf} value={u.uf}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody className="flex items-start gap-8">
          <div className="shrink-0">
            <p className="text-[32px] font-semibold leading-none tabular-nums">{counts.total}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">documentos</p>
            <div className="mt-3 flex flex-col gap-1.5">
              <Badge tone="danger">{counts.required} obrigatórios</Badge>
              <Badge tone="warning">{counts.conditional} condicionais</Badge>
              <Badge>{counts.optional} opcionais</Badge>
            </div>
          </div>
          <div className="min-w-0 border-l border-border pl-8">
            <h2 className="text-[15px] font-semibold">
              {type} — {modality} · {ufName}
            </h2>
            <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-muted-foreground">
              {guideSummary.headline}
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {docGroups.map((group) => {
          const req = group.items.filter((i) => i.requirement === 'OBRIGATÓRIO').length
          const cond = group.items.filter((i) => i.requirement === 'CONDICIONAL').length

          return (
            <Card key={group.label}>
              <CardHeader
                title={group.label}
                description={group.description}
                action={
                  <span className="text-[12px] text-muted-foreground">
                    <strong className="font-semibold text-foreground">{req} obrigatórios</strong> · {cond}{' '}
                    condicionais
                  </span>
                }
              />
              <ul className="divide-y divide-border">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-start justify-between gap-6 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-medium">{item.name}</p>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {item.formats}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>

                      {item.when && (
                        <p className="mt-1.5 text-[12px] text-muted-foreground">
                          <span className="font-semibold uppercase tracking-wide">Quando:</span> {item.when}
                        </p>
                      )}

                      {item.stateNote && item.stateNote.uf === uf && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-md bg-info-soft px-2.5 py-1.5 text-[12px] text-[#4338ca]">
                          <MapPin className="mt-0.5 size-3 shrink-0" />
                          <span>
                            <strong className="font-semibold">{item.stateNote.uf}</strong> · {item.stateNote.text}
                          </span>
                        </p>
                      )}
                    </div>

                    <Badge tone={requirementTone[item.requirement]} className="mt-0.5 shrink-0">
                      {item.requirement}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6 border-[#f59e0b33] bg-warning-soft">
        <CardBody className="flex items-start gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-[#b45309]" />
          <div>
            <p className="text-[13px] font-semibold text-[#b45309]">Atenção</p>
            <p className="mt-1 max-w-[95ch] text-[13px] leading-relaxed text-[#92400e]">
              {guideSummary.disclaimer}
            </p>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
