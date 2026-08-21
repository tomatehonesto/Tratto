import type { Audit } from './types'

export const audits: Audit[] = [
  {
    dealId: '#001',
    type: 'Compra e Venda',
    address: 'Rua Vergueiro, 1200 – Apto 302',
    city: 'São Paulo, SP',
    groups: [
      { label: 'Comprador', done: 2, total: 5 },
      { label: 'Vendedor', done: 2, total: 7 },
      { label: 'Imóvel', done: 2, total: 5 },
    ],
    verdict: 'Bloqueador',
  },
  {
    dealId: '#002',
    type: 'Locação',
    address: 'Al. Santos, 800 – Conj. 94',
    city: 'São Paulo, SP',
    groups: [
      { label: 'Locatário', done: 4, total: 5 },
      { label: 'Locador / Proprietário', done: 3, total: 3 },
      { label: 'Imóvel', done: 4, total: 4 },
    ],
    verdict: 'Atenção',
  },
  {
    dealId: '#003',
    type: 'Compra e Venda',
    address: 'Av. Paulista, 2300 – Apto 151',
    city: 'São Paulo, SP',
    groups: [
      { label: 'Comprador', done: 5, total: 5 },
      { label: 'Vendedor', done: 6, total: 7 },
      { label: 'Imóvel', done: 4, total: 5 },
    ],
    verdict: 'Atenção',
  },
  {
    dealId: '#004',
    type: 'Compra e Venda',
    address: 'Rua Haddock Lobo, 595 – Apto 82',
    city: 'São Paulo, SP',
    groups: [
      { label: 'Comprador', done: 0, total: 5 },
      { label: 'Vendedor', done: 0, total: 7 },
      { label: 'Imóvel', done: 0, total: 5 },
    ],
    verdict: 'Bloqueador',
  },
  {
    dealId: '#005',
    type: 'Locação',
    address: 'Rua Oscar Freire, 2000 – Apto 41',
    city: 'São Paulo, SP',
    groups: [
      { label: 'Locatário', done: 5, total: 5 },
      { label: 'Locador / Proprietário', done: 3, total: 3 },
      { label: 'Imóvel', done: 4, total: 4 },
    ],
    verdict: 'Aprovado',
  },
  {
    dealId: '#006',
    type: 'Compra e Venda',
    address: 'Rua Funchal, 418 – Sala 501',
    city: 'São Paulo, SP',
    groups: [
      { label: 'Comprador', done: 2, total: 5 },
      { label: 'Vendedor', done: 3, total: 7 },
      { label: 'Imóvel', done: 2, total: 5 },
    ],
    verdict: 'Bloqueador',
  },
]

export interface ChecklistEntry {
  label: string
  optional?: boolean
  note?: string
}

export interface ChecklistModel {
  model: string
  required: number
  optional: number
  groups: { label: string; items: ChecklistEntry[] }[]
}

/** Certidões exigidas por tipo de operação — base da auditoria de cada negócio. */
export const checklistModels: ChecklistModel[] = [
  {
    model: 'Compra e Venda',
    required: 14,
    optional: 3,
    groups: [
      {
        label: 'COMPRADOR',
        items: [
          { label: 'CND Federal (RFB/PGFN)' },
          { label: 'Certidão de Regularidade FGTS' },
          { label: 'Certidão de Quitação Trabalhista' },
          { label: 'Certidão de Distribuições Cíveis' },
          { label: 'Certidão de Estado Civil', optional: true, note: 'Obrig. se casado' },
        ],
      },
      {
        label: 'VENDEDOR',
        items: [
          { label: 'CND Federal (RFB/PGFN)' },
          { label: 'Certidão de Regularidade FGTS' },
          { label: 'Certidão de Quitação Trabalhista' },
          { label: 'Certidão de Distribuições Cíveis' },
          { label: 'Certidão de Distribuições Criminais' },
          { label: 'Certidão de Protestos' },
          { label: 'Certidão Negativa Estadual', optional: true, note: 'Conforme estado' },
        ],
      },
      {
        label: 'IMÓVEL',
        items: [
          { label: 'Certidão de Matrícula Atualizada' },
          { label: 'Certidão Negativa de IPTU' },
          { label: 'Certidão de Ônus Reais' },
          { label: 'Certidão Dívida Ativa Municipal (PGM)' },
          { label: 'Declaração de Quitação Condominial', optional: true, note: 'Obrig. se condomínio' },
        ],
      },
    ],
  },
  {
    model: 'Locação',
    required: 9,
    optional: 3,
    groups: [
      {
        label: 'LOCATÁRIO',
        items: [
          { label: 'RG ou CNH (frente e verso)' },
          { label: 'CPF' },
          { label: 'Comprovante de Renda (3 meses)' },
          { label: 'Comprovante de Residência' },
          { label: 'Certidão Negativa de Débitos', optional: true, note: 'Recomendado' },
        ],
      },
      {
        label: 'LOCADOR / PROPRIETÁRIO',
        items: [
          { label: 'RG ou CNH' },
          { label: 'CPF / CNPJ' },
          { label: 'Certidão de Matrícula do Imóvel' },
        ],
      },
      {
        label: 'IMÓVEL',
        items: [
          { label: 'Certidão Negativa de IPTU' },
          { label: 'Laudo de Vistoria' },
          { label: 'Certidão de Ônus Reais', optional: true, note: 'Recomendado' },
          { label: 'AVCB', optional: true, note: 'Obrig. para comercial' },
        ],
      },
    ],
  },
  {
    model: 'Permuta',
    required: 14,
    optional: 0,
    groups: [
      {
        label: 'PERMUTANTE A',
        items: [
          { label: 'CND Federal (RFB/PGFN)' },
          { label: 'Certidão de Regularidade FGTS' },
          { label: 'Certidão de Quitação Trabalhista' },
          { label: 'Certidão Dist. Cíveis e Criminais' },
        ],
      },
      {
        label: 'PERMUTANTE B',
        items: [
          { label: 'CND Federal (RFB/PGFN)' },
          { label: 'Certidão de Regularidade FGTS' },
          { label: 'Certidão de Quitação Trabalhista' },
          { label: 'Certidão Dist. Cíveis e Criminais' },
        ],
      },
      {
        label: 'IMÓVEL A',
        items: [
          { label: 'Certidão de Matrícula Atualizada' },
          { label: 'Certidão Negativa de IPTU' },
          { label: 'Certidão de Ônus Reais' },
        ],
      },
      {
        label: 'IMÓVEL B',
        items: [
          { label: 'Certidão de Matrícula Atualizada' },
          { label: 'Certidão Negativa de IPTU' },
          { label: 'Certidão de Ônus Reais' },
        ],
      },
    ],
  },
]
