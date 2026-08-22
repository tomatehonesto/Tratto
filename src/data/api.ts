import { supabase } from '@/lib/supabase'
import { initialsFrom } from '@/lib/initials'
import type {
  Activity,
  ActivityKind,
  Audit,
  Certidao,
  CertidaoStatus,
  Contract,
  ContractStatus,
  Deal,
  DealStatus,
  DealStage,
  DealType,
  Pendency,
  Signature,
  SignatureStatus,
  User,
  UserRole,
} from './types'

/**
 * Camada única de acesso ao Supabase. As páginas continuam consumindo os
 * tipos de domínio de types.ts — o mapeamento de linha do banco para domínio
 * mora só aqui, então mudar o schema não espalha alteração pela interface.
 */

function client() {
  if (!supabase) throw new Error('Supabase não configurado.')
  return supabase
}

/**
 * Relação aninhada do PostgREST.
 *
 * O supabase-js tipa toda relação embutida como array, mas em runtime uma
 * relação many-to-one (a FK está nesta tabela) volta como objeto. Normalizar
 * aqui deixa o mapeamento correto independente de qual dos dois chegar.
 */
function one<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return (value[0] ?? null) as T | null
  return value as T
}

/** Erros do PostgREST não são legíveis; traduzimos o que importa. */
function fail(context: string, error: { message: string; code?: string }): never {
  if (error.code === 'PGRST301' || /jwt/i.test(error.message)) {
    throw new Error('Sessão expirada. Entre novamente.')
  }
  throw new Error(`Não foi possível carregar ${context}.`)
}

// ---------------------------------------------------------------------------
// Negócios
// ---------------------------------------------------------------------------

interface PartyRow {
  side: 'buyer' | 'seller'
  name: string
  role: string
  email: string | null
}

export async function fetchDeals(): Promise<Deal[]> {
  const { data, error } = await client()
    .from('deals')
    .select('reference, type, address, district, city, status, stage, progress, value, recurring, updated_at, owner:profiles(name), parties:deal_parties(side, name, role, email)')
    .order('reference')

  if (error) fail('os negócios', error)

  return (data ?? []).map((row) => {
    const parties = (row.parties ?? []) as PartyRow[]
    const buyer = parties.find((p) => p.side === 'buyer')
    const seller = parties.find((p) => p.side === 'seller')
    const ownerName = one<{ name: string }>(row.owner)?.name ?? '—'

    return {
      id: row.reference as string,
      type: row.type as DealType,
      address: row.address as string,
      district: (row.district as string) ?? '',
      city: (row.city as string) ?? '',
      status: row.status as DealStatus,
      stage: row.stage as DealStage,
      progress: row.progress as number,
      value: Number(row.value ?? 0),
      recurring: Boolean(row.recurring),
      buyer: {
        name: buyer?.name ?? '—',
        initials: initialsFrom(buyer?.name ?? '?'),
        role: buyer?.role ?? 'Comprador',
      },
      seller: {
        name: seller?.name ?? '—',
        initials: initialsFrom(seller?.name ?? '?'),
        role: seller?.role ?? 'Vendedor',
      },
      owner: { name: ownerName, initials: initialsFrom(ownerName) },
      updatedAt: (row.updated_at as string)?.slice(0, 10) ?? '',
    }
  })
}

export interface NewDealInput {
  type: DealType
  /** Linha composta para exibição; as partes vão nos campos abaixo. */
  address: string
  cep: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  uf: string
  value: number
  recurring: boolean
  stage: DealStage
  buyer: { name: string; role: string }
  seller: { name: string; role: string }
}

/**
 * Cria o negócio e as duas partes numa transação só, via função no banco.
 *
 * Duas chamadas separadas do cliente poderiam deixar um negócio sem partes se
 * a segunda falhasse — o PostgREST não expõe transação. `organization_id` e a
 * referência (#001) são resolvidos no servidor.
 *
 * Retorna a referência gerada.
 */
export async function createDeal(input: NewDealInput): Promise<string> {
  const { data, error } = await client().rpc('create_deal', {
    p_type: input.type,
    p_address: input.address,
    p_cep: input.cep,
    p_street: input.street,
    p_number: input.number,
    p_complement: input.complement,
    p_district: input.district,
    p_city: input.city,
    p_uf: input.uf,
    p_value: input.value,
    p_recurring: input.recurring,
    p_stage: input.stage,
    p_buyer_name: input.buyer.name,
    p_buyer_role: input.buyer.role,
    p_seller_name: input.seller.name,
    p_seller_role: input.seller.role,
  })

  if (error) {
    if (error.code === '42501') throw new Error('Você não tem permissão para criar negócios.')
    if (error.message.includes('vinculado a nenhuma imobiliária')) {
      throw new Error('Sua conta não está vinculada a nenhuma imobiliária.')
    }
    throw new Error('Não foi possível criar o negócio.')
  }

  return data as string
}

// ---------------------------------------------------------------------------
// Detalhe do negócio
// ---------------------------------------------------------------------------

export interface DealParticipant {
  name: string
  initials: string
  role: string
  email: string | null
  side: 'buyer' | 'seller' | 'team'
}

export interface DealDetail {
  deal: Deal
  participants: DealParticipant[]
  certidoes: Certidao[]
  contract: Contract | null
  signatures: Signature[]
  audit: Audit | null
  activities: Activity[]
  createdAt: string
}

/** Carrega tudo de um negócio pela referência (#001). */
export async function fetchDealDetail(reference: string): Promise<DealDetail | null> {
  const db = client()

  const { data: row, error } = await db
    .from('deals')
    // Precisa ser um literal único: o supabase-js analisa esta string para
    // inferir os tipos, e uma concatenação em runtime derruba a inferência.
    .select('id, reference, type, address, district, city, status, stage, progress, value, recurring, created_at, updated_at, owner:profiles(name, email), parties:deal_parties(side, name, role, email)')
    .eq('reference', reference)
    .maybeSingle()

  if (error) fail('o negócio', error)
  if (!row) return null

  const parties = (row.parties ?? []) as PartyRow[]
  const buyer = parties.find((p) => p.side === 'buyer')
  const seller = parties.find((p) => p.side === 'seller')
  const owner = one<{ name: string; email: string }>(row.owner)
  const ownerName = owner?.name ?? '—'

  const deal: Deal = {
    id: row.reference as string,
    type: row.type as DealType,
    address: row.address as string,
    district: (row.district as string) ?? '',
    city: (row.city as string) ?? '',
    status: row.status as DealStatus,
    stage: row.stage as DealStage,
    progress: row.progress as number,
    value: Number(row.value ?? 0),
    recurring: Boolean(row.recurring),
    buyer: {
      name: buyer?.name ?? '—',
      initials: initialsFrom(buyer?.name ?? '?'),
      role: buyer?.role ?? 'Comprador',
    },
    seller: {
      name: seller?.name ?? '—',
      initials: initialsFrom(seller?.name ?? '?'),
      role: seller?.role ?? 'Vendedor',
    },
    owner: { name: ownerName, initials: initialsFrom(ownerName) },
    updatedAt: (row.updated_at as string)?.slice(0, 10) ?? '',
  }

  const dealUuid = row.id as string

  // Escopadas ao negócio — no protótipo estas abas mostravam tudo de todos.
  const [certRes, contractRes, auditRes, actRes] = await Promise.all([
    db
      .from('certificates')
      .select('id, name, origin, agency, requested_at, valid_until, cost, status')
      .eq('deal_id', dealUuid)
      .order('requested_at'),
    db
      .from('contracts')
      .select('id, version, type, status, updated_at, owner:profiles(name)')
      .eq('deal_id', dealUuid)
      .maybeSingle(),
    db
      .from('audits')
      .select('verdict, audit_groups(label, done, total, position)')
      .eq('deal_id', dealUuid)
      .maybeSingle(),
    db
      .from('activities')
      .select('title, kind, status, occurred_at')
      .eq('deal_id', dealUuid)
      .order('occurred_at', { ascending: false }),
  ])

  const firstError = certRes.error ?? contractRes.error ?? auditRes.error ?? actRes.error
  if (firstError) fail('os dados do negócio', firstError)

  const certidoes: Certidao[] = (certRes.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    dealId: reference,
    origin: c.origin as string,
    agency: c.agency as string,
    requestedAt: (c.requested_at as string) ?? '',
    validUntil: (c.valid_until as string) ?? null,
    cost: c.cost === null ? null : Number(c.cost),
    status: c.status as CertidaoStatus,
  }))

  let contract: Contract | null = null
  let signatures: Signature[] = []

  if (contractRes.data) {
    const c = contractRes.data
    const cOwner = one<{ name: string }>(c.owner)?.name ?? null
    contract = {
      dealId: reference,
      address: deal.address,
      type: c.type as DealType,
      version: (c.version as string) ?? null,
      owner: cOwner ? { name: cOwner, initials: initialsFrom(cOwner) } : null,
      updatedAt: (c.updated_at as string)?.slice(0, 10) ?? null,
      status: c.status as ContractStatus,
    }

    const { data: sigRows } = await db
      .from('signatures')
      .select('id, name, email, role, sent_at, deadline, status')
      .eq('contract_id', c.id as string)

    signatures = (sigRows ?? []).map((s) => ({
      id: s.id as string,
      name: s.name as string,
      initials: initialsFrom(s.name as string),
      email: s.email as string,
      dealId: reference,
      contract: `Contrato de ${c.type}${c.version ? ` ${c.version}` : ''}`,
      role: s.role as string,
      sentAt: (s.sent_at as string) ?? '',
      deadline: (s.deadline as string) ?? '',
      status: s.status as SignatureStatus,
    }))
  }

  let audit: Audit | null = null
  if (auditRes.data) {
    const groups = ((auditRes.data.audit_groups ?? []) as AuditGroupRow[])
      .slice()
      .sort((a, b) => a.position - b.position)
    audit = {
      dealId: reference,
      type: deal.type,
      address: deal.address,
      city: deal.city,
      groups: groups.map((g) => ({ label: g.label, done: g.done, total: g.total })),
      verdict: auditRes.data.verdict as Audit['verdict'],
    }
  }

  const activities: Activity[] = (actRes.data ?? []).map((a) => ({
    title: a.title as string,
    kind: a.kind as ActivityKind,
    dealId: reference,
    address: deal.address,
    city: deal.city,
    status: a.status as DealStatus,
    at: relativeTime(a.occurred_at as string),
  }))

  const participants: DealParticipant[] = [
    buyer && {
      name: buyer.name,
      initials: initialsFrom(buyer.name),
      role: buyer.role,
      email: buyer.email,
      side: 'buyer' as const,
    },
    seller && {
      name: seller.name,
      initials: initialsFrom(seller.name),
      role: seller.role,
      email: seller.email,
      side: 'seller' as const,
    },
    owner && {
      name: owner.name,
      initials: initialsFrom(owner.name),
      role: 'Responsável',
      email: owner.email,
      side: 'team' as const,
    },
  ].filter(Boolean) as DealParticipant[]

  return {
    deal,
    participants,
    certidoes,
    contract,
    signatures,
    audit,
    activities,
    createdAt: (row.created_at as string)?.slice(0, 10) ?? '',
  }
}

// ---------------------------------------------------------------------------
// Certidões
// ---------------------------------------------------------------------------

export async function fetchCertidoes(): Promise<Certidao[]> {
  const { data, error } = await client()
    .from('certificates')
    .select('id, name, origin, agency, requested_at, valid_until, cost, status, deals!inner(reference)')
    .order('requested_at')

  if (error) fail('as certidões', error)

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    dealId: one<{ reference: string }>(row.deals)?.reference ?? '',
    origin: row.origin as string,
    agency: row.agency as string,
    requestedAt: (row.requested_at as string) ?? '',
    validUntil: (row.valid_until as string) ?? null,
    cost: row.cost === null ? null : Number(row.cost),
    status: row.status as CertidaoStatus,
  }))
}

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------

export async function fetchContracts(): Promise<Contract[]> {
  const { data, error } = await client()
    .from('contracts')
    .select('version, type, status, updated_at, owner:profiles(name), deals!inner(reference, address)')

  if (error) fail('os contratos', error)

  return (data ?? [])
    .map((row) => {
      const deal = one<{ reference: string; address: string }>(row.deals)
      const ownerName = one<{ name: string }>(row.owner)?.name ?? null

      return {
        dealId: deal?.reference ?? '',
        address: deal?.address ?? '',
        type: row.type as DealType,
        version: (row.version as string) ?? null,
        owner: ownerName ? { name: ownerName, initials: initialsFrom(ownerName) } : null,
        updatedAt: (row.updated_at as string)?.slice(0, 10) ?? null,
        status: row.status as ContractStatus,
      }
    })
    .sort((a, b) => a.dealId.localeCompare(b.dealId))
}

// ---------------------------------------------------------------------------
// Assinaturas
// ---------------------------------------------------------------------------

export async function fetchSignatures(): Promise<Signature[]> {
  const { data, error } = await client()
    .from('signatures')
    .select('id, name, email, role, sent_at, deadline, status, contracts!inner(type, version, deals!inner(reference))')

  if (error) fail('as assinaturas', error)

  return (data ?? [])
    .map((row) => {
      const contract = one<{
        type: string
        version: string | null
        deals: unknown
      }>(row.contracts)
      const deal = one<{ reference: string }>(contract?.deals)

      return {
        id: row.id as string,
        name: row.name as string,
        initials: initialsFrom(row.name as string),
        email: row.email as string,
        dealId: deal?.reference ?? '',
        contract: `Contrato de ${contract?.type ?? ''}${contract?.version ? ` ${contract.version}` : ''}`,
        role: row.role as string,
        sentAt: (row.sent_at as string) ?? '',
        deadline: (row.deadline as string) ?? '',
        status: row.status as SignatureStatus,
      }
    })
    .sort((a, b) => a.dealId.localeCompare(b.dealId))
}

// ---------------------------------------------------------------------------
// Auditoria
// ---------------------------------------------------------------------------

interface AuditGroupRow {
  label: string
  done: number
  total: number
  position: number
}

export async function fetchAudits(): Promise<Audit[]> {
  const { data, error } = await client()
    .from('audits')
    .select('verdict, deals!inner(reference, type, address, city), audit_groups(label, done, total, position)')

  if (error) fail('a auditoria', error)

  return (data ?? [])
    .map((row) => {
      const deal = one<{ reference: string; type: DealType; address: string; city: string }>(row.deals)
      const groups = ((row.audit_groups ?? []) as AuditGroupRow[])
        .slice()
        .sort((a, b) => a.position - b.position)

      return {
        dealId: deal?.reference ?? '',
        type: (deal?.type ?? 'Compra e Venda') as DealType,
        address: deal?.address ?? '',
        city: deal?.city ?? '',
        groups: groups.map((g) => ({ label: g.label, done: g.done, total: g.total })),
        verdict: row.verdict as Audit['verdict'],
      }
    })
    .sort((a, b) => a.dealId.localeCompare(b.dealId))
}

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await client()
    .from('profiles')
    .select('name, email, role, active, last_access')
    .order('created_at')

  if (error) fail('os usuários', error)

  return (data ?? []).map((row) => ({
    name: row.name as string,
    initials: initialsFrom(row.name as string),
    email: row.email as string,
    role: row.role as UserRole,
    active: Boolean(row.active),
    lastAccess: relativeDay(row.last_access as string | null),
  }))
}

/** "hoje" / "ontem" / "12 out" — como o protótipo exibia. */
function relativeDay(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  const today = new Date()
  const days = Math.floor((today.getTime() - date.getTime()) / 86_400_000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

// ---------------------------------------------------------------------------
// Atividades e pendências
// ---------------------------------------------------------------------------

export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await client()
    .from('activities')
    .select('title, kind, status, occurred_at, deals!inner(reference, address, city)')
    .order('occurred_at', { ascending: false })
    .limit(10)

  if (error) fail('as atividades', error)

  return (data ?? []).map((row) => {
    const deal = one<{ reference: string; address: string; city: string }>(row.deals)
    return {
      title: row.title as string,
      kind: row.kind as ActivityKind,
      dealId: deal?.reference ?? '',
      address: deal?.address ?? '',
      city: deal?.city ?? '',
      status: row.status as DealStatus,
      at: relativeTime(row.occurred_at as string),
    }
  })
}

/** "há 12 min" / "há 2h" / "ontem". */
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  return `há ${days} dias`
}

// ---------------------------------------------------------------------------
// Volume mensal
// ---------------------------------------------------------------------------

export interface MonthBucket {
  month: string
  negocios: number
  certidoes: number
  documentos: number
}

/**
 * Agrega os últimos 12 meses a partir das linhas reais. Antes isto era um
 * array fixo — agora o gráfico reflete o que existe no banco, o que também
 * significa que ele fica esparso enquanto o volume for baixo.
 */
export async function fetchMonthlyVolume(): Promise<MonthBucket[]> {
  const db = client()
  const since = new Date()
  since.setMonth(since.getMonth() - 11)
  since.setDate(1)
  const sinceIso = since.toISOString().slice(0, 10)

  const [deals, certs, acts] = await Promise.all([
    db.from('deals').select('created_at').gte('created_at', sinceIso),
    db.from('certificates').select('requested_at').gte('requested_at', sinceIso),
    db.from('activities').select('occurred_at').gte('occurred_at', sinceIso),
  ])

  const firstError = deals.error ?? certs.error ?? acts.error
  if (firstError) fail('o volume mensal', firstError)

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  // 12 baldes terminando no mês corrente, na ordem cronológica.
  const buckets: MonthBucket[] = []
  const index = new Map<string, MonthBucket>()
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = { month: MONTHS[d.getMonth()], negocios: 0, certidoes: 0, documentos: 0 }
    buckets.push(bucket)
    index.set(key, bucket)
  }

  const bump = (iso: string | null, field: keyof Omit<MonthBucket, 'month'>) => {
    if (!iso) return
    const d = new Date(iso)
    const bucket = index.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (bucket) bucket[field] += 1
  }

  deals.data?.forEach((r) => bump(r.created_at as string, 'negocios'))
  certs.data?.forEach((r) => bump(r.requested_at as string, 'certidoes'))
  acts.data?.forEach((r) => bump(r.occurred_at as string, 'documentos'))

  return buckets
}

export async function fetchPendencies(): Promise<Pendency[]> {
  const { data, error } = await client()
    .from('pendencies')
    .select('title, priority, deals!inner(reference)')
    .eq('resolved', false)

  if (error) fail('as pendências', error)

  const order = { Alta: 0, Média: 1, Baixa: 2 }
  return (data ?? [])
    .map((row) => ({
      title: row.title as string,
      dealId: one<{ reference: string }>(row.deals)?.reference ?? '',
      priority: row.priority as Pendency['priority'],
    }))
    .sort((a, b) => order[a.priority] - order[b.priority])
}
