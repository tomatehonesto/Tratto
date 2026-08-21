import type { Tone } from '@/components/ui/badge'
import type {
  AuditVerdict,
  CertidaoStatus,
  ContractStatus,
  DealStatus,
  SignatureStatus,
} from '@/data/types'

/**
 * Mapeamento único status → tom visual. Centralizado para que a mesma
 * situação nunca apareça com cores diferentes em telas diferentes.
 */

export const dealTone: Record<DealStatus, Tone> = {
  'Em andamento': 'info',
  'Aguard. assinatura': 'warning',
  Bloqueado: 'danger',
  Concluído: 'success',
}

export const certidaoTone: Record<CertidaoStatus, Tone> = {
  Recebida: 'success',
  Solicitada: 'info',
  Pendente: 'warning',
  Vencida: 'danger',
}

export const contractTone: Record<ContractStatus, Tone> = {
  'Em revisão': 'info',
  'Aguard. assinatura': 'warning',
  Assinado: 'success',
  'Não gerado': 'neutral',
}

export const signatureTone: Record<SignatureStatus, Tone> = {
  Assinado: 'success',
  Aguardando: 'warning',
}

export const verdictTone: Record<AuditVerdict, Tone> = {
  Aprovado: 'success',
  Atenção: 'warning',
  Bloqueador: 'danger',
}

export function progressTone(value: number) {
  if (value >= 100) return 'success' as const
  if (value >= 60) return 'info' as const
  if (value >= 30) return 'warning' as const
  return 'danger' as const
}
