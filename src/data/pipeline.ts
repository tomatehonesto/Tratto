import type { Certidao, Contract, DealStage, Signature } from './types'

export type StepState = 'concluido' | 'andamento' | 'pendente'

export interface PipelineStep {
  label: string
  state: StepState
  optional?: boolean
  detail?: string
}

/**
 * Pipeline padrão de um negócio. Fica em código, não no banco: é o mesmo
 * roteiro para toda imobiliária e muda por deploy, como os checklists.
 *
 * O estado deriva da etapa do negócio — que é o que o protótipo fazia: #001,
 * parado em "Certidões", mostrava 7/13, exatamente as sete primeiras. Onde há
 * dado real (certidões, contrato, assinaturas), refinamos em cima disso.
 */
const STEPS = [
  'Negócio criado',
  'Convite enviado ao comprador',
  'Convite enviado ao vendedor',
  'Documentos do comprador',
  'Documentos do vendedor',
  'Matrícula do imóvel',
  'OCR e validação automática',
  'Certidões pessoais',
  'Certidões do imóvel',
  'Contrato gerado',
  'Revisão jurídica',
  'Aprovação das partes',
  'Assinaturas',
] as const

/** Quantas etapas já estão concluídas quando o negócio está em cada fase. */
const CONCLUIDAS_ATE: Record<DealStage, number> = {
  'Coleta de documentos': 3,
  Certidões: 7,
  Revisão: 9,
  Assinatura: 12,
  Finalizado: STEPS.length,
}

export function buildPipeline(
  stage: DealStage,
  certidoes: Certidao[],
  contract: Contract | null,
  signatures: Signature[],
): PipelineStep[] {
  const concluidas = CONCLUIDAS_ATE[stage] ?? 0

  const pessoais = certidoes.filter((c) => c.origin !== 'Imóvel')
  const imovel = certidoes.filter((c) => c.origin === 'Imóvel')

  const steps: PipelineStep[] = STEPS.map((label, i) => {
    const base: StepState = i < concluidas ? 'concluido' : i === concluidas ? 'andamento' : 'pendente'
    return { label, state: base }
  })

  // Refinamentos com dado real — só quando existe algo para dizer.
  const refinarCertidoes = (idx: number, lista: Certidao[]) => {
    if (lista.length === 0) return
    const recebidas = lista.filter((c) => c.status === 'Recebida').length
    steps[idx].detail = `${recebidas}/${lista.length} recebidas`
    if (recebidas === lista.length) steps[idx].state = 'concluido'
    else if (steps[idx].state === 'pendente') steps[idx].state = 'andamento'
  }
  refinarCertidoes(7, pessoais)
  refinarCertidoes(8, imovel)

  if (contract) {
    if (contract.status !== 'Não gerado') {
      steps[9].state = 'concluido'
      steps[9].detail = contract.version ?? undefined
    }
    if (contract.status === 'Assinado') {
      steps[10].state = 'concluido'
      steps[11].state = 'concluido'
    } else if (contract.status === 'Em revisão' && steps[10].state === 'pendente') {
      steps[10].state = 'andamento'
    }
  }

  if (signatures.length > 0) {
    const assinadas = signatures.filter((s) => s.status === 'Assinado').length
    steps[12].detail = `${assinadas}/${signatures.length} assinaram`
    if (assinadas === signatures.length) steps[12].state = 'concluido'
    else if (steps[12].state === 'pendente') steps[12].state = 'andamento'
  }

  return [
    ...steps,
    { label: 'Laudo de vistoria', state: 'pendente', optional: true },
    { label: 'Seguro imobiliário', state: 'pendente', optional: true },
  ]
}

export function countConcluidas(steps: PipelineStep[]) {
  const obrigatorias = steps.filter((s) => !s.optional)
  return {
    done: obrigatorias.filter((s) => s.state === 'concluido').length,
    total: obrigatorias.length,
  }
}
