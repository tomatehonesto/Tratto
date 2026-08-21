import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/stat'
import { Select } from '@/components/ui/field'
import { Table, Th, Td, Tr } from '@/components/ui/table'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states'
import { PageHeader } from '@/components/layout/AppLayout'
import { fetchCertidoes } from '@/data/api'
import { useQuery } from '@/hooks/useQuery'
import { certidaoTone } from '@/lib/status'
import { formatCost, formatDate } from '@/lib/format'

export default function Certidoes() {
  const [status, setStatus] = useState('todos')
  const { data, loading, error, reload } = useQuery(fetchCertidoes)

  const certidoes = useMemo(() => data ?? [], [data])

  const visible = useMemo(
    () => (status === 'todos' ? certidoes : certidoes.filter((c) => c.status === status)),
    [certidoes, status],
  )

  const received = certidoes.filter((c) => c.status === 'Recebida').length
  const inProgress = certidoes.filter((c) => c.status === 'Solicitada').length
  const expired = certidoes.filter((c) => c.status === 'Vencida').length

  return (
    <>
      <PageHeader title="Certidões" description="Todas as certidões solicitadas automaticamente" />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Stat label="Total" value={loading ? '—' : certidoes.length} />
        <Stat label="Recebidas" value={loading ? '—' : received} hintTone="success" />
        <Stat label="Em andamento" value={loading ? '—' : inProgress} hintTone="warning" />
        <Stat label="Vencidas" value={loading ? '—' : expired} hintTone="danger" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={loading}>
          <option value="todos">Todos os status</option>
          <option value="Recebida">Recebida</option>
          <option value="Solicitada">Em andamento</option>
          <option value="Pendente">Pendente</option>
          <option value="Vencida">Vencida</option>
        </Select>
        {!loading && !error && (
          <span className="text-[13px] text-muted-foreground">
            {visible.length} certid{visible.length === 1 ? 'ão' : 'ões'}
          </span>
        )}
      </div>

      {loading ? (
        <LoadingState label="Carregando certidões..." />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState message="Nenhuma certidão com este status." />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Certidão</Th>
                <Th>Negócio</Th>
                <Th>Origem</Th>
                <Th>Órgão</Th>
                <Th>Solicitada</Th>
                <Th>Validade</Th>
                <Th className="text-right">Custo</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td className="font-mono text-[12px] text-muted-foreground">{c.dealId}</Td>
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
      )}
    </>
  )
}
