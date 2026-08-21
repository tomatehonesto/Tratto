# Tratto

Plataforma de Due Diligence para imobiliárias. Aplicação **web desktop** (layout otimizado para telas grandes, largura mínima de 1180px).

## Stack

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS v4** (`@tailwindcss/vite`), tokens em `src/index.css`
- **React Router 7** para navegação
- **lucide-react** para ícones
- Gráficos em SVG próprio — sem dependência de biblioteca de charts

## Rodando

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha com as credenciais do Supabase
(Project Settings → API). Sem elas a tela de login avisa que a autenticação não
está configurada e o acesso fica bloqueado.

```bash
npm run dev
```

Outros scripts: `npm run build` (typecheck + bundle) e `npm run preview`.

## Autenticação

Login por email/senha via **Supabase Auth**. Não há cadastro público — usuários
são criados pelo administrador no painel do Supabase, o que é o comportamento
esperado para uma plataforma B2B.

- `src/contexts/AuthContext.tsx` — sessão, `signIn`, `signOut`
- `src/components/auth/ProtectedRoute.tsx` — bloqueia as rotas internas
- `src/pages/Login.tsx` — tela de entrada

A `anon key` é pública por design: ela vai no bundle e não é segredo. A proteção
dos dados vem das policies de Row Level Security no banco — o que passa a
importar quando os dados saírem de `src/data/` e forem para o Postgres.

## Estrutura

```
src/
├── components/
│   ├── ui/          Primitivas (card, badge, button, table, states…)
│   ├── auth/        ProtectedRoute
│   ├── layout/      AppLayout, Sidebar, PageHeader
│   └── charts/      VolumeChart (SVG)
├── contexts/        AuthContext
├── data/            api.ts (queries), types.ts (domínio), conteúdo de referência
├── hooks/           useQuery
├── lib/             supabase, formatação pt-BR, status → cor
└── pages/           Uma página por rota

supabase/
└── migrations/      SQL aplicado no painel do Supabase
```

## Design system

Os tokens em `src/index.css` foram extraídos do protótipo Figma Make
(`chair-frame-66638781.figma.site`): paleta, tipografia (DM Sans / JetBrains Mono),
raios e cores de gráfico. Toda cor de status passa por `src/lib/status.ts`, para que
a mesma situação nunca apareça com cores diferentes em telas distintas.

## Módulos

| Rota | Descrição |
| --- | --- |
| `/` | Dashboard — indicadores, pendências, atividades, volume mensal |
| `/negocios` | Negócios em cards, com filtros por status, tipo e busca |
| `/documentos` | Guia de documentação por tipo de transação, modalidade e UF |
| `/certidoes` | Tabela de certidões com origem, órgão, validade e custo |
| `/auditoria` | Conformidade documental por negócio + checklists padrão |
| `/contratos` | Contratos e versões |
| `/assinaturas` | Monitoramento de assinaturas eletrônicas |
| `/administracao` | Usuários, permissões, modelos, integrações e empresa |

## Banco de dados

Postgres do Supabase, multi-tenant: cada linha pertence a uma organização
(imobiliária) e a Row Level Security garante o isolamento entre elas.

As migrations ficam em `supabase/migrations/` e são aplicadas no SQL Editor do
Supabase, em ordem:

| Arquivo | O que faz |
| --- | --- |
| `0001_schema.sql` | Tabelas, índices, RLS e policies |
| `0002_seed.sql` | Dados de demonstração e vínculo do seu usuário |
| `0003_grants.sql` | Privilégios de tabela para `authenticated` |

O `0003` não é opcional. O projeto está com *"Automatically expose new tables"*
desligado — o que é o certo, porque dá controle tabela a tabela — mas isso faz
tabelas criadas por SQL nascerem sem `GRANT`. Policy não substitui privilégio:
sem ele o PostgREST devolve `42501` mesmo para usuário autenticado. `anon` fica
sem acesso de propósito, como camada extra além da RLS.

O isolamento gira em torno de `current_org_id()`, que resolve a organização do
usuário logado. Ela é `SECURITY DEFINER` porque as policies de `profiles`
precisam consultar `profiles` — sem isso o Postgres entra em recursão.

Só existem policies de **SELECT**: o app ainda não escreve no banco. Quando
escrever, cada tabela vai precisar de policies de insert/update/delete com a
mesma checagem de organização.

### O que fica fora do banco

O guia de documentação por UF (`src/data/documentos.ts`) e os checklists por
modelo (`src/data/checklists.ts`) seguem em código de propósito: são conteúdo de
referência, idênticos para toda imobiliária e versionados por deploy.

## Estado atual

Autenticação e dados transacionais no Supabase. `src/data/api.ts` concentra todas
as queries e mapeia as linhas do banco para os tipos de domínio de `types.ts` —
as páginas não sabem que o Supabase existe.

Ainda não há escrita: a interface é somente leitura, e os botões de ação
(Novo negócio, Reenviar, Convidar usuário) não estão ligados.
