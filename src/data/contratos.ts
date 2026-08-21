import type { Contract, Signature } from './types'

export const contracts: Contract[] = [
  { dealId: '#001', address: 'Rua Vergueiro, 1200 – Apto 302', type: 'Compra e Venda', version: 'v3', owner: { name: 'Dra. Mariana Costa', initials: 'DM' }, updatedAt: '2024-11-01', status: 'Em revisão' },
  { dealId: '#002', address: 'Al. Santos, 800 – Conj. 94', type: 'Locação', version: 'v2', owner: { name: 'Dr. Ricardo Souza', initials: 'DR' }, updatedAt: '2024-11-03', status: 'Aguard. assinatura' },
  { dealId: '#003', address: 'Av. Paulista, 2300 – Apto 151', type: 'Compra e Venda', version: 'v4', owner: { name: 'Dra. Mariana Costa', initials: 'DM' }, updatedAt: '2024-11-01', status: 'Em revisão' },
  { dealId: '#004', address: 'Rua Haddock Lobo, 595 – Apto 82', type: 'Compra e Venda', version: null, owner: null, updatedAt: null, status: 'Não gerado' },
  { dealId: '#005', address: 'Rua Oscar Freire, 2000 – Apto 41', type: 'Locação', version: 'v2', owner: { name: 'Dra. Mariana Costa', initials: 'DM' }, updatedAt: '2024-10-25', status: 'Assinado' },
  { dealId: '#006', address: 'Rua Funchal, 418 – Sala 501', type: 'Compra e Venda', version: 'v1', owner: { name: 'Sistema Tratto', initials: 'ST' }, updatedAt: '2024-10-28', status: 'Em revisão' },
]

export const signatures: Signature[] = [
  { id: 's1', name: 'Fernanda Oliveira Lima', initials: 'FO', email: 'fernanda.lima@email.com', dealId: '#002', contract: 'Contrato de Locação v2', role: 'Locatário', sentAt: '2024-11-03', deadline: '2024-11-20', status: 'Aguardando' },
  { id: 's2', name: 'Pedro Augusto Ramos', initials: 'PA', email: 'pedramos@gmail.com', dealId: '#002', contract: 'Contrato de Locação v2', role: 'Locador', sentAt: '2024-11-03', deadline: '2024-11-20', status: 'Aguardando' },
  { id: 's3', name: 'Dr. Ricardo Souza', initials: 'DR', email: 'juridico@tratto.com.br', dealId: '#002', contract: 'Contrato de Locação v2', role: 'Testemunha', sentAt: '2024-11-03', deadline: '2024-11-20', status: 'Assinado' },
  { id: 's4', name: 'Marcos Vinícius Telles', initials: 'MV', email: 'mv.telles@corp.com.br', dealId: '#003', contract: 'Contrato de Compra e Venda v4', role: 'Comprador', sentAt: '2024-11-01', deadline: '2024-12-01', status: 'Assinado' },
  { id: 's5', name: 'Claudia Regina Nunes', initials: 'CR', email: 'claudia.nunes@gmail.com', dealId: '#003', contract: 'Contrato de Compra e Venda v4', role: 'Vendedor', sentAt: '2024-11-01', deadline: '2024-12-01', status: 'Aguardando' },
  { id: 's6', name: 'Lucas Ferreira', initials: 'LF', email: 'lucas.f@design.io', dealId: '#005', contract: 'Contrato de Locação v2', role: 'Locatário', sentAt: '2024-10-25', deadline: '2024-11-10', status: 'Assinado' },
  { id: 's7', name: 'Renata Melo', initials: 'RM', email: 'renata.melo@gmail.com', dealId: '#005', contract: 'Contrato de Locação v2', role: 'Locador', sentAt: '2024-10-25', deadline: '2024-11-10', status: 'Assinado' },
]
