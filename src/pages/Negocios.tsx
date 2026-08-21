import { useMemo, useState } from 'react'
import { Plus, MapPin, AlertTriangle } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AvatarPair, Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { SearchInput, Select } from '@/components/ui/field'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states'
import { NovoNegocioModal } from '@/components/deals/NovoNegocioModal'
import { PageHeader } from '@/components/layout/AppLayout'
import { fetchDeals } from '@/data/api'
import { useQuery } from '@/hooks/useQuery'
import type { Deal } from '@/data/types'
import { dealTone, progressTone } from '@/lib/status'
import { formatCurrency, formatDate } from '@/lib/format'

const STATUS_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'Em andamento', label: 'Em andamento' },
  { value: 'Aguard. assinatura', label: 'Aguard. assinatura' },
  { value: 'Bloqueado', label: 'Bloqueados' },
  { value: 'Concluído', label: 'Concluídos' },
]

export default function Negocios() {
  const [status, setStatus] = useState('todos')
  const [type, setType] = useState('todos')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [created, setCreated] = useState<string | null>(null)

  const { data, loading, error, reload } = useQuery(fetchDeals)
  const deals = useMemo(() => data ?? [], [data])

  const filters = useMemo(
    () =>
      STATUS_FILTERS.map((f) => ({
        ...f,
        count: f.value === 'todos' ? deals.length : deals.filter((d) => d.status === f.value).length,
      })),
    [deals],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return deals.filter((d) => {
      if (status !== 'todos' && d.status !== status) return false
      if (type !== 'todos' && d.type !== type) return false
      if (!q) return true
      return (
        d.address.toLowerCase().includes(q) ||
        d.id.includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.buyer.name.toLowerCase().includes(q) ||
        d.seller.name.toLowerCase().includes(q)
      )
    })
  }, [deals, status, type, query])

  const active = deals.filter((d) => d.status === 'Em andamento').length
  const blocked = deals.filter((d) => d.status === 'Bloqueado').length

  return (
    <>
      <PageHeader
        title="Negócios"
        description={
          loading
            ? 'Carregando...'
            : `${deals.length} negócios · ${active} em andamento · ${blocked} bloqueado${blocked === 1 ? '' : 's'}`
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
        onCreated={(reference) => {
          setModalOpen(false)
          setCreated(reference)
          reload()
        }}
      />

      {created && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-[#10b98133] bg-success-soft px-4 py-3">
          <p className="text-[13px] text-[#047857]">
            Negócio <strong className="font-semibold">{created}</strong> criado.
          </p>
          <button
            onClick={() => setCreated(null)}
            className="cursor-pointer text-[12px] text-[#047857] underline underline-offset-2"
          >
            Dispensar
          </button>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-4">
        <Tabs items={filters} value={status} onChange={setStatus} />
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="w-[220px]"
          />
          <Select value={type} onChange={(e) => setType(e.target.value)} disabled={loading}>
            <option value="todos">Todos os tipos</option>
            <option value="Compra e Venda">Compra e Venda</option>
            <option value="Locação">Locação</option>
            <option value="Permuta">Permuta</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Carregando negócios..." />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState message="Nenhum negócio corresponde aos filtros aplicados." />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {visible.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}
    </>
  )
}

function DealCard({ deal: d }: { deal: Deal }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-[0_2px_12px_rgba(10,10,15,0.07)]">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] text-muted-foreground">{d.id}</span>
          <Badge>{d.type}</Badge>
        </div>
        {d.status === 'Bloqueado' && (
          <Badge tone="danger">
            <AlertTriangle className="size-3" /> Bloqueado
          </Badge>
        )}
      </div>

      <CardBody className="flex-1 space-y-4">
        <div>
          <h3 className="text-[14px] font-semibold leading-snug">{d.address}</h3>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
            <MapPin className="size-3" />
            {d.district} · {d.city}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AvatarPair a={d.buyer.initials} b={d.seller.initials} />
            <div>
              <p className="text-[13px] font-medium leading-tight">
                {d.buyer.name.split(' ')[0]} &amp; {d.seller.name.split(' ')[0]}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {d.buyer.role} · {d.seller.role}
              </p>
            </div>
          </div>
          <Badge tone={dealTone[d.status]} dot>
            {d.status}
          </Badge>
        </div>

        <p className="text-[18px] font-semibold tabular-nums">
          {formatCurrency(d.value)}
          {d.recurring && <span className="text-[12px] font-normal text-muted-foreground"> /mês</span>}
        </p>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{d.stage}</span>
            <span className="tabular-nums text-muted-foreground">{d.progress}%</span>
          </div>
          <Progress value={d.progress} tone={progressTone(d.progress)} />
        </div>
      </CardBody>

      <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
        <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Avatar initials={d.owner.initials} size={22} />
          {d.owner.name}
        </span>
        <span className="text-[12px] text-muted-foreground">{formatDate(d.updatedAt)}</span>
      </div>
    </Card>
  )
}
