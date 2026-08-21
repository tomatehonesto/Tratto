import { Fragment, useState } from 'react'
import { UserPlus, MoreHorizontal, Check, Minus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { UnderlineTabs } from '@/components/ui/tabs'
import { Table, Th, Td, Tr } from '@/components/ui/table'
import { PageHeader } from '@/components/layout/AppLayout'
import { users } from '@/data/usuarios'
import type { UserRole } from '@/data/types'

const TABS = [
  { value: 'usuarios', label: 'Usuários' },
  { value: 'permissoes', label: 'Permissões' },
  { value: 'modelos', label: 'Modelos de contrato' },
  { value: 'integracoes', label: 'Integrações' },
  { value: 'empresa', label: 'Empresa' },
]

export default function Administracao() {
  const [tab, setTab] = useState('usuarios')

  return (
    <>
      <PageHeader
        title="Administração"
        description="Gerencie usuários, permissões, modelos e configurações da plataforma."
      />

      <div className="mb-6">
        <UnderlineTabs items={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === 'usuarios' && <UsuariosTab />}
      {tab === 'permissoes' && <PermissoesTab />}
      {tab === 'modelos' && <ModelosTab />}
      {tab === 'integracoes' && <IntegracoesTab />}
      {tab === 'empresa' && <EmpresaTab />}
    </>
  )
}

const roleTone = {
  Admin: 'info',
  Jurídico: 'warning',
  Corretor: 'neutral',
} as const

function UsuariosTab() {
  const active = users.filter((u) => u.active).length

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          <strong className="font-semibold text-foreground">{users.length} usuários</strong> · {active} ativos
        </p>
        <Button variant="primary">
          <UserPlus /> Convidar usuário
        </Button>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Usuário</Th>
              <Th>Email</Th>
              <Th>Papel</Th>
              <Th>Status</Th>
              <Th>Último acesso</Th>
              <Th className="text-right" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.email}>
                <Td>
                  <span className="flex items-center gap-2.5">
                    <Avatar initials={u.initials} size={30} />
                    <span className="font-medium">{u.name}</span>
                  </span>
                </Td>
                <Td className="text-muted-foreground">{u.email}</Td>
                <Td>
                  <Badge tone={roleTone[u.role]}>{u.role}</Badge>
                </Td>
                <Td>
                  <Badge tone={u.active ? 'success' : 'neutral'} dot>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground">{u.lastAccess}</Td>
                <Td className="text-right">
                  <Button variant="ghost" size="sm" aria-label={`Ações para ${u.name}`}>
                    <MoreHorizontal />
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}

/** Matriz de permissões por papel — derivada dos módulos existentes na sidebar. */
const ROLES: UserRole[] = ['Admin', 'Jurídico', 'Corretor']

const PERMISSIONS: { area: string; actions: { label: string; allowed: UserRole[] }[] }[] = [
  {
    area: 'Negócios',
    actions: [
      { label: 'Visualizar negócios', allowed: ['Admin', 'Jurídico', 'Corretor'] },
      { label: 'Criar negócio', allowed: ['Admin', 'Corretor'] },
      { label: 'Excluir negócio', allowed: ['Admin'] },
    ],
  },
  {
    area: 'Documentos e certidões',
    actions: [
      { label: 'Solicitar certidões', allowed: ['Admin', 'Jurídico', 'Corretor'] },
      { label: 'Aprovar documentação', allowed: ['Admin', 'Jurídico'] },
    ],
  },
  {
    area: 'Contratos',
    actions: [
      { label: 'Gerar contrato', allowed: ['Admin', 'Jurídico'] },
      { label: 'Editar cláusulas', allowed: ['Admin', 'Jurídico'] },
      { label: 'Enviar para assinatura', allowed: ['Admin', 'Jurídico'] },
    ],
  },
  {
    area: 'Administração',
    actions: [
      { label: 'Gerenciar usuários', allowed: ['Admin'] },
      { label: 'Configurar integrações', allowed: ['Admin'] },
    ],
  },
]

function PermissoesTab() {
  return (
    <Card>
      <CardHeader title="Permissões por papel" description="O que cada perfil pode fazer na plataforma" />
      <Table>
        <thead>
          <tr>
            <Th>Ação</Th>
            {ROLES.map((r) => (
              <Th key={r} className="w-[120px] text-center">
                {r}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((group) => (
            <Fragment key={group.area}>
              <tr>
                <Td
                  colSpan={ROLES.length + 1}
                  className="bg-[#fafaff] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {group.area}
                </Td>
              </tr>
              {group.actions.map((a) => (
                <Tr key={a.label}>
                  <Td>{a.label}</Td>
                  {ROLES.map((r) => (
                    <Td key={r} className="text-center">
                      {a.allowed.includes(r) ? (
                        <Check className="mx-auto size-4 text-[#10b981]" aria-label="Permitido" />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Não permitido" />
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

const TEMPLATES = [
  { name: 'Compra e Venda — Direta', version: 'v6', updatedAt: '01 de nov. de 2024', clauses: 24, active: true },
  { name: 'Compra e Venda — Financiamento', version: 'v4', updatedAt: '18 de out. de 2024', clauses: 31, active: true },
  { name: 'Locação Residencial', version: 'v9', updatedAt: '25 de out. de 2024', clauses: 19, active: true },
  { name: 'Locação Comercial', version: 'v3', updatedAt: '02 de set. de 2024', clauses: 22, active: true },
  { name: 'Permuta', version: 'v2', updatedAt: '14 de ago. de 2024', clauses: 27, active: false },
]

function ModelosTab() {
  return (
    <Card>
      <CardHeader
        title="Modelos de contrato"
        description="Minutas versionadas usadas na geração automática"
        action={<Button variant="primary">Novo modelo</Button>}
      />
      <Table>
        <thead>
          <tr>
            <Th>Modelo</Th>
            <Th>Versão</Th>
            <Th className="text-right">Cláusulas</Th>
            <Th>Última atualização</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map((t) => (
            <Tr key={t.name}>
              <Td className="font-medium">{t.name}</Td>
              <Td className="font-mono text-[12px]">{t.version}</Td>
              <Td className="text-right tabular-nums text-muted-foreground">{t.clauses}</Td>
              <Td className="text-muted-foreground">{t.updatedAt}</Td>
              <Td>
                <Badge tone={t.active ? 'success' : 'neutral'} dot>
                  {t.active ? 'Ativo' : 'Arquivado'}
                </Badge>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

const INTEGRATIONS = [
  { name: 'Receita Federal', description: 'Emissão de CND Federal (RFB/PGFN)', status: 'Conectado' },
  { name: 'TJSP', description: 'Certidões de distribuições cíveis e criminais', status: 'Conectado' },
  { name: 'Prefeitura de São Paulo', description: 'IPTU, ITBI e dívida ativa municipal', status: 'Conectado' },
  { name: 'Cartórios de Registro de Imóveis', description: 'Matrícula atualizada e ônus reais', status: 'Conectado' },
  { name: 'Assinatura eletrônica', description: 'Envio e rastreio de assinaturas com validade jurídica', status: 'Conectado' },
  { name: 'SABESP', description: 'Declaração de quitação de água e esgoto', status: 'Pendente' },
]

function IntegracoesTab() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {INTEGRATIONS.map((i) => (
        <Card key={i.name}>
          <CardBody className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold">{i.name}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{i.description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge tone={i.status === 'Conectado' ? 'success' : 'warning'} dot>
                {i.status}
              </Badge>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

const COMPANY = [
  { label: 'Razão social', value: 'Tratto Tecnologia Imobiliária Ltda.' },
  { label: 'CNPJ', value: '48.912.774/0001-06' },
  { label: 'Endereço', value: 'Av. Brigadeiro Faria Lima, 3477 — Itaim Bibi, São Paulo, SP' },
  { label: 'CRECI responsável', value: 'CRECI-SP 41.882-J' },
  { label: 'Email de contato', value: 'contato@tratto.com.br' },
  { label: 'Fuso horário', value: 'America/Sao_Paulo (GMT-3)' },
]

function EmpresaTab() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="col-span-2">
        <CardHeader title="Dados da empresa" description="Informações usadas na emissão de contratos" />
        <CardBody>
          <dl className="divide-y divide-border">
            {COMPANY.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-6 py-3 first:pt-0 last:pb-0">
                <dt className="text-[13px] text-muted-foreground">{f.label}</dt>
                <dd className="text-right text-[13px] font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Plano" description="Assinatura atual" />
        <CardBody className="space-y-4">
          <div>
            <p className="text-[20px] font-semibold">Tratto Pro</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Faturamento mensal</p>
          </div>
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Usuários</dt>
              <dd className="tabular-nums">{users.length} / 15</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Certidões / mês</dt>
              <dd className="tabular-nums">11 / 200</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Próxima cobrança</dt>
              <dd>01 de dez. de 2024</dd>
            </div>
          </dl>
          <Button variant="outline" className="w-full">
            Gerenciar assinatura
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
