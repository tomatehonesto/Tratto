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

```bash
npm run dev
```

Outros scripts: `npm run build` (typecheck + bundle) e `npm run preview`.

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

Front-end completo sobre dados mock. Não há backend, autenticação nem persistência —
`src/data/` é o ponto único de troca para plugar uma API real.
