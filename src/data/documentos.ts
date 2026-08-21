import type { DocGroup } from './types'

export const UFS = [
  { uf: 'SP', name: 'SP — São Paulo' },
  { uf: 'RJ', name: 'RJ — Rio de Janeiro' },
  { uf: 'MG', name: 'MG — Minas Gerais' },
  { uf: 'DF', name: 'DF — Distrito Federal' },
  { uf: 'RS', name: 'RS — Rio Grande do Sul' },
  { uf: 'PR', name: 'PR — Paraná' },
  { uf: 'SC', name: 'SC — Santa Catarina' },
  { uf: 'BA', name: 'BA — Bahia' },
  { uf: 'GO', name: 'GO — Goiás' },
  { uf: 'CE', name: 'CE — Ceará' },
  { uf: 'PE', name: 'PE — Pernambuco' },
  { uf: 'AM', name: 'AM — Amazonas' },
]

export const TRANSACTION_TYPES = ['Compra e Venda', 'Locação', 'Permuta'] as const
export const MODALITIES = ['Direta', 'Financiamento'] as const

export const guideSummary = {
  headline: 'Compra direta sem financiamento bancário. Documentação simplificada para cartório e transferência.',
  disclaimer:
    'Esta lista é um guia de referência baseado nas exigências mais comuns para o estado de São Paulo. Cartórios e instituições financeiras podem exigir documentos adicionais. Consulte sempre o advogado responsável pelo negócio antes de iniciar a coleta.',
}

export const docGroups: DocGroup[] = [
  {
    label: 'Comprador',
    description: 'Pessoa física ou jurídica adquirente',
    items: [
      { name: 'Documento de Identidade', formats: 'PDF, JPG', description: 'RG ou CNH — frente e verso legíveis', requirement: 'OBRIGATÓRIO' },
      { name: 'CPF', formats: 'PDF, JPG', description: 'Cartão físico ou comprovante da Receita Federal', requirement: 'OBRIGATÓRIO' },
      { name: 'Certidão de Estado Civil', formats: 'PDF', description: 'Certidão de nascimento (solteiro), casamento, divórcio ou viuvez', requirement: 'OBRIGATÓRIO' },
      { name: 'Comprovante de Residência', formats: 'PDF, JPG', description: 'Conta de água, luz ou telefone com até 3 meses de emissão', requirement: 'OBRIGATÓRIO' },
      { name: 'Declaração de Imposto de Renda', formats: 'PDF', description: 'Última declaração entregue à Receita Federal com recibo', requirement: 'OBRIGATÓRIO' },
      { name: 'Pacto Antenupcial', formats: 'PDF', description: 'Se casado em regime diferente da comunhão parcial de bens', requirement: 'CONDICIONAL', when: 'Casado em regime diverso da comunhão parcial' },
      { name: 'Procuração', formats: 'PDF', description: 'Pública ou particular, se representado por terceiro', requirement: 'CONDICIONAL', when: 'Comprador representado por procurador' },
      { name: 'Contrato Social / CNPJ', formats: 'PDF', description: 'Se pessoa jurídica: contrato social, última alteração e cartão CNPJ', requirement: 'CONDICIONAL', when: 'Pessoa jurídica adquirente' },
    ],
  },
  {
    label: 'Vendedor',
    description: 'Proprietário atual do imóvel',
    items: [
      { name: 'Documento de Identidade', formats: 'PDF, JPG', description: 'RG ou CNH — frente e verso', requirement: 'OBRIGATÓRIO' },
      { name: 'CPF', formats: 'PDF, JPG', description: 'Cartão físico ou comprovante da Receita Federal', requirement: 'OBRIGATÓRIO' },
      { name: 'Certidão de Estado Civil', formats: 'PDF', description: 'Certidão de nascimento (solteiro), casamento, divórcio ou viuvez', requirement: 'OBRIGATÓRIO' },
      { name: 'Comprovante de Residência', formats: 'PDF, JPG', description: 'Conta de água, luz ou telefone com até 3 meses de emissão', requirement: 'OBRIGATÓRIO' },
      { name: 'Declaração de Imposto de Renda', formats: 'PDF', description: 'Última declaração com recibo de entrega', requirement: 'OBRIGATÓRIO' },
      { name: 'Pacto Antenupcial', formats: 'PDF', description: 'Se casado em regime diverso da comunhão parcial', requirement: 'CONDICIONAL', when: 'Casado em regime diverso da comunhão parcial' },
      { name: 'Contrato Social / CNPJ', formats: 'PDF', description: 'Se pessoa jurídica: contrato social e cartão CNPJ', requirement: 'CONDICIONAL', when: 'Pessoa jurídica vendedora' },
      { name: 'Inventário / Formal de Partilha', formats: 'PDF', description: 'Se imóvel recebido por herança ou partilha', requirement: 'CONDICIONAL', when: 'Imóvel originado por herança ou divórcio' },
    ],
  },
  {
    label: 'Imóvel',
    description: 'Documentação do bem objeto da transação',
    items: [
      {
        name: 'Matrícula Atualizada do Imóvel',
        formats: 'PDF',
        description: 'Emitida há no máximo 30 dias pelo Cartório de Registro de Imóveis',
        requirement: 'OBRIGATÓRIO',
        stateNote: { uf: 'SP', text: 'CRI competente conforme o bairro. Taxa: R$ 10–50.' },
      },
      {
        name: 'Carnê de IPTU (exercício atual)',
        formats: 'PDF',
        description: 'Demonstrativo do IPTU do ano vigente com o valor venal do imóvel',
        requirement: 'OBRIGATÓRIO',
        stateNote: { uf: 'SP', text: 'Disponível no portal da Prefeitura de SP (iptu.prefeitura.sp.gov.br).' },
      },
      {
        name: 'Habite-se / Auto de Conclusão',
        formats: 'PDF',
        description: 'Documento da prefeitura atestando conformidade da construção com o projeto aprovado',
        requirement: 'OBRIGATÓRIO',
      },
      {
        name: 'Guia de ITBI',
        formats: 'PDF',
        description: 'Guia de Imposto de Transmissão de Bens Imóveis emitida pela prefeitura',
        requirement: 'OBRIGATÓRIO',
        stateNote: { uf: 'SP', text: 'ITBI: 3% sobre valor venal ou transação (maior). Emitir em: itbi.prefeitura.sp.gov.br.' },
      },
      {
        name: 'Declaração de Quitação Condominial',
        formats: 'PDF',
        description: 'Emitida pela administradora ou síndico, comprovando ausência de débitos',
        requirement: 'CONDICIONAL',
        when: 'Imóvel em condomínio (apartamento ou casa em condomínio)',
      },
      {
        name: 'Comprovante de Quitação de Água',
        formats: 'PDF',
        description: 'Declaração da concessionária de inexistência de débitos de água e esgoto',
        requirement: 'OBRIGATÓRIO',
        stateNote: { uf: 'SP', text: 'SABESP: sabesp.com.br/quitacao.' },
      },
      { name: 'Planta aprovada do imóvel', formats: 'PDF', description: 'Projeto arquitetônico aprovado pela prefeitura', requirement: 'OPCIONAL' },
      { name: 'Memorial Descritivo', formats: 'PDF', description: 'Descrição técnica das características do imóvel', requirement: 'OPCIONAL' },
    ],
  },
]

/** Contadores por tipo de transação, usados nos atalhos do dashboard. */
export const docCountsByType = [
  { label: 'Compra e Venda', count: 17 },
  { label: 'Locação', count: 12 },
  { label: 'Permuta', count: 14 },
  { label: 'Auditoria', count: 5 },
]
