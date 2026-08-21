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
│   ├── ui/          Primitivas (card, badge, button, table, tabs, avatar…)
│   ├── layout/      AppLayout, Sidebar, PageHeader
│   └── charts/      VolumeChart (SVG)
├── data/            Camada de dados mock, tipada — troque por chamadas de API
├── lib/             utils, formatação pt-BR, mapeamento status → cor
└── pages/           Uma página por rota
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

## Estado atual

Front-end completo com autenticação real (Supabase Auth). Os **dados** ainda são
mock: `src/data/` é o ponto único de troca para migrar ao Postgres do Supabase.

Vale saber: o login protege a interface, mas o conteúdo de `src/data/` é compilado
no bundle e continua legível por quem inspecionar os arquivos JS, mesmo sem entrar.
Isso é inofensivo enquanto os dados são fictícios — e deixa de ser no dia em que
forem reais, que é exatamente quando eles devem passar a vir do banco.
