export type DealType = 'Compra e Venda' | 'Locação' | 'Permuta' | 'Auditoria'

export type DealStatus = 'Em andamento' | 'Aguard. assinatura' | 'Bloqueado' | 'Concluído'

export type DealStage =
  | 'Coleta de documentos'
  | 'Certidões'
  | 'Revisão'
  | 'Assinatura'
  | 'Finalizado'

export interface Party {
  name: string
  initials: string
  role: string
  email?: string
}

export interface Deal {
  id: string
  type: DealType
  address: string
  district: string
  city: string
  status: DealStatus
  stage: DealStage
  progress: number
  value: number
  /** Locação exibe o valor como mensalidade. */
  recurring?: boolean
  buyer: Party
  seller: Party
  owner: { name: string; initials: string }
  updatedAt: string
}

export type CertidaoStatus = 'Recebida' | 'Solicitada' | 'Pendente' | 'Vencida'

export interface Certidao {
  id: string
  name: string
  dealId: string
  origin: string
  agency: string
  requestedAt: string
  validUntil: string | null
  cost: number | null
  status: CertidaoStatus
}

export type ContractStatus = 'Em revisão' | 'Aguard. assinatura' | 'Assinado' | 'Não gerado'

export interface Contract {
  dealId: string
  address: string
  type: DealType
  version: string | null
  owner: { name: string; initials: string } | null
  updatedAt: string | null
  status: ContractStatus
}

export type SignatureStatus = 'Assinado' | 'Aguardando'

export interface Signature {
  id: string
  name: string
  initials: string
  email: string
  dealId: string
  contract: string
  role: string
  sentAt: string
  deadline: string
  status: SignatureStatus
}

export type AuditVerdict = 'Aprovado' | 'Atenção' | 'Bloqueador'

export interface AuditGroup {
  label: string
  done: number
  total: number
}

export interface Audit {
  dealId: string
  type: DealType
  address: string
  city: string
  groups: AuditGroup[]
  verdict: AuditVerdict
}

export type ActivityKind = 'Contrato' | 'Auditoria' | 'Certidão' | 'Documento'

export interface Activity {
  title: string
  kind: ActivityKind
  dealId: string
  address: string
  city: string
  status: DealStatus
  at: string
}

export interface Pendency {
  title: string
  dealId: string
  priority: 'Alta' | 'Média' | 'Baixa'
}

export type UserRole = 'Admin' | 'Jurídico' | 'Corretor'

export interface User {
  name: string
  initials: string
  email: string
  role: UserRole
  active: boolean
  lastAccess: string
}

export type DocRequirement = 'OBRIGATÓRIO' | 'CONDICIONAL' | 'OPCIONAL'

export interface DocItem {
  name: string
  formats: string
  description: string
  requirement: DocRequirement
  /** Condição que torna o documento exigível. */
  when?: string
  /** Nota específica do estado selecionado. */
  stateNote?: { uf: string; text: string }
}

export interface DocGroup {
  label: string
  description: string
  items: DocItem[]
}
