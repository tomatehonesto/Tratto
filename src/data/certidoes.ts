import type { Certidao } from './types'

export const certidoes: Certidao[] = [
  { id: 'c1', name: 'CND Federal', dealId: '#001', origin: 'Comprador', agency: 'Receita Federal', requestedAt: '2024-10-22', validUntil: '2025-04-24', cost: null, status: 'Recebida' },
  { id: 'c2', name: 'Certidão IPTU', dealId: '#001', origin: 'Imóvel', agency: 'Prefeitura de SP', requestedAt: '2024-10-22', validUntil: '2025-01-23', cost: null, status: 'Recebida' },
  { id: 'c3', name: 'Certidão PGM', dealId: '#001', origin: 'Imóvel', agency: 'PGM SP', requestedAt: '2024-10-22', validUntil: null, cost: 45, status: 'Solicitada' },
  { id: 'c4', name: 'Certidão de Ônus Reais', dealId: '#001', origin: 'Imóvel', agency: 'CRI — 9º Oficial', requestedAt: '2024-10-22', validUntil: null, cost: 120, status: 'Solicitada' },
  { id: 'c5', name: 'CND Federal', dealId: '#002', origin: 'Locatário', agency: 'Receita Federal', requestedAt: '2024-10-23', validUntil: '2025-04-25', cost: null, status: 'Recebida' },
  { id: 'c6', name: 'Dist. Cível', dealId: '#002', origin: 'Locatário', agency: 'TJSP', requestedAt: '2024-10-23', validUntil: '2025-04-26', cost: 30, status: 'Recebida' },
  { id: 'c7', name: 'Certidão de Ônus Reais', dealId: '#003', origin: 'Imóvel', agency: 'CRI — 1º Oficial', requestedAt: '2024-10-01', validUntil: '2025-04-04', cost: 120, status: 'Recebida' },
  { id: 'c8', name: 'CND Federal', dealId: '#003', origin: 'Vendedor', agency: 'Receita Federal', requestedAt: '2024-10-01', validUntil: '2025-04-03', cost: null, status: 'Recebida' },
  { id: 'c9', name: 'Certidão IPTU', dealId: '#004', origin: 'Imóvel', agency: 'Prefeitura de SP', requestedAt: '2024-11-03', validUntil: null, cost: null, status: 'Solicitada' },
  { id: 'c10', name: 'Certidão IPTU', dealId: '#006', origin: 'Imóvel', agency: 'Prefeitura de SP', requestedAt: '2024-10-08', validUntil: '2024-10-09', cost: null, status: 'Vencida' },
  { id: 'c11', name: 'Certidão de Ônus Reais', dealId: '#006', origin: 'Imóvel', agency: 'CRI — 5º Oficial', requestedAt: '2024-10-08', validUntil: null, cost: 120, status: 'Pendente' },
]
