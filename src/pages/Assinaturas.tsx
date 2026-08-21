import { Send } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Stat } from '@/components/ui/stat'
import { Table, Th, Td, Tr } from '@/components/ui/table'
import { PageHeader, SectionTitle } from '@/components/layout/AppLayout'
import { signatures } from '@/data/contratos'
import { signatureTone } from '@/lib/status'
import { formatDate } from '@/lib/format'

export default function Assinaturas() {
  const signed = signatures.filter((s) => s.status === 'Assinado').length
  const awaiting = signatures.filter((s) => s.status === 'Aguardando')
  const dealsInSigning = new Set(awaiting.map((s) => s.dealId)).size

  return (
    <>
      <PageHeader title="Assinaturas" description="Monitoramento de assinaturas eletrônicas" />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Stat label="Total de signatários" value={signatures.length} />
        <Stat label="Assinados" value={signed} hintTone="success" />
        <Stat label="Aguardando" value={awaiting.length} hintTone="warning" />
        <Stat label="Negócios em assinatura" value={dealsInSigning} />
      </div>

      <SectionTitle>Aguardando assinatura</SectionTitle>
      <div className="mb-6 grid grid-cols-3 gap-4">
        {awaiting.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start gap-3">
              <Avatar initials={s.initials} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight">{s.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {s.role} · {s.email}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Negócio
                </dt>
                <dd className="mt-1">
                  <span className="font-mono text-[13px]">{s.dealId}</span>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{s.contract}</p>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Prazo
                </dt>
                <dd className="mt-1 text-[13px]">{formatDate(s.deadline)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3.5">
              <Badge tone={signatureTone[s.status]} dot>
                {s.status}
              </Badge>
              <Button size="sm">
                <Send /> Reenviar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Todas as assinaturas" />
        <Table>
          <thead>
            <tr>
              <Th>Signatário</Th>
              <Th>Negócio</Th>
              <Th>Contrato</Th>
              <Th>Papel</Th>
              <Th>Enviado em</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {signatures.map((s) => (
              <Tr key={s.id}>
                <Td>
                  <span className="flex items-center gap-2.5">
                    <Avatar initials={s.initials} size={30} />
                    <span className="min-w-0">
                      <p className="font-medium leading-tight">{s.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{s.email}</p>
                    </span>
                  </span>
                </Td>
                <Td className="font-mono text-[12px] text-muted-foreground">{s.dealId}</Td>
                <Td className="text-muted-foreground">{s.contract}</Td>
                <Td className="text-muted-foreground">{s.role}</Td>
                <Td className="text-muted-foreground">{formatDate(s.sentAt)}</Td>
                <Td>
                  <Badge tone={signatureTone[s.status]} dot>
                    {s.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}
