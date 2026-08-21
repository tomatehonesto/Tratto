import { useMemo } from 'react'
import { Download, Eye, MoreHorizontal } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Stat } from '@/components/ui/stat'
import { Table, Th, Td, Tr } from '@/components/ui/table'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states'
import { PageHeader } from '@/components/layout/AppLayout'
import { fetchContracts } from '@/data/api'
import { useQuery } from '@/hooks/useQuery'
import { contractTone } from '@/lib/status'
import { formatDate } from '@/lib/format'

export default function Contratos() {
  const { data, loading, error, reload } = useQuery(fetchContracts)
  const contracts = useMemo(() => data ?? [], [data])

  const inReview = contracts.filter((c) => c.status === 'Em revisão').length
  const awaiting = contracts.filter((c) => c.status === 'Aguard. assinatura').length
  const signed = contracts.filter((c) => c.status === 'Assinado').length
  const generated = contracts.filter((c) => c.status !== 'Não gerado').length

  return (
    <>
      <PageHeader title="Contratos" description="Gestão de contratos e versões" />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Stat label="Total de contratos" value={loading ? '—' : generated} />
        <Stat label="Em revisão" value={loading ? '—' : inReview} hintTone="warning" />
        <Stat label="Aguard. assinatura" value={loading ? '—' : awaiting} hintTone="warning" />
        <Stat label="Assinados" value={loading ? '—' : signed} hintTone="success" />
      </div>

      {loading ? (
        <LoadingState label="Carregando contratos..." />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : contracts.length === 0 ? (
        <EmptyState message="Nenhum contrato cadastrado." />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Negócio / Imóvel</Th>
                <Th>Tipo</Th>
                <Th>Versão</Th>
                <Th>Responsável</Th>
                <Th>Última edição</Th>
                <Th>Status</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <Tr key={c.dealId}>
                  <Td>
                    <span className="font-mono text-[12px] text-muted-foreground">{c.dealId}</span>
                    <p className="mt-0.5 font-medium">{c.address}</p>
                  </Td>
                  <Td className="text-muted-foreground">{c.type}</Td>
                  <Td className="font-mono text-[12px]">{c.version ?? '—'}</Td>
                  <Td>
                    {c.owner ? (
                      <span className="flex items-center gap-2">
                        <Avatar initials={c.owner.initials} size={24} />
                        <span className="text-muted-foreground">{c.owner.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">{formatDate(c.updatedAt)}</Td>
                  <Td>
                    <Badge tone={contractTone[c.status]} dot>
                      {c.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" aria-label={`Visualizar contrato ${c.dealId}`} disabled={!c.version}>
                        <Eye />
                      </Button>
                      <Button variant="ghost" size="sm" aria-label={`Baixar contrato ${c.dealId}`} disabled={!c.version}>
                        <Download />
                      </Button>
                      <Button variant="ghost" size="sm" aria-label={`Mais ações para ${c.dealId}`}>
                        <MoreHorizontal />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  )
}
