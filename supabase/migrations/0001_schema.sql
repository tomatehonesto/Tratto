-- Tratto — schema inicial
-- Multi-tenant: cada linha pertence a uma organização (imobiliária) e a RLS
-- garante que ninguém enxergue dado de outra.
--
-- Rode este arquivo inteiro no SQL Editor do Supabase antes do 0002_seed.sql.

-- ---------------------------------------------------------------------------
-- Organizações
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  cnpj        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Perfis
--
-- auth_user_id é nulo de propósito: permite cadastrar a equipe da imobiliária
-- antes de convidar cada pessoa. Ao criar o usuário no Auth, basta preencher
-- este campo para ligar a conta ao perfil.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  auth_user_id     uuid unique references auth.users (id) on delete set null,
  name             text not null,
  email            text not null,
  role             text not null default 'Corretor' check (role in ('Admin', 'Jurídico', 'Corretor')),
  active           boolean not null default true,
  last_access      timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists profiles_organization_idx on public.profiles (organization_id);
create index if not exists profiles_auth_user_idx on public.profiles (auth_user_id);

-- ---------------------------------------------------------------------------
-- Organização do usuário logado
--
-- SECURITY DEFINER é obrigatório aqui: as policies de profiles precisam
-- consultar profiles, e sem isso o Postgres entra em recursão infinita.
-- ---------------------------------------------------------------------------

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

-- ---------------------------------------------------------------------------
-- Negócios
-- ---------------------------------------------------------------------------

create table if not exists public.deals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  reference        text not null,
  type             text not null check (type in ('Compra e Venda', 'Locação', 'Permuta', 'Auditoria')),
  address          text not null,
  district         text,
  city             text,
  status           text not null check (status in ('Em andamento', 'Aguard. assinatura', 'Bloqueado', 'Concluído')),
  stage            text not null check (stage in ('Coleta de documentos', 'Certidões', 'Revisão', 'Assinatura', 'Finalizado')),
  progress         integer not null default 0 check (progress between 0 and 100),
  value            numeric(14, 2),
  -- Locação exibe o valor como mensalidade.
  recurring        boolean not null default false,
  owner_id         uuid references public.profiles (id) on delete set null,
  updated_at       timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (organization_id, reference)
);

create index if not exists deals_organization_idx on public.deals (organization_id);
create index if not exists deals_status_idx on public.deals (organization_id, status);

-- ---------------------------------------------------------------------------
-- Partes do negócio
-- ---------------------------------------------------------------------------

create table if not exists public.deal_parties (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals (id) on delete cascade,
  -- 'buyer' cobre comprador/locatário/permutante A; 'seller' o outro lado.
  side        text not null check (side in ('buyer', 'seller')),
  name        text not null,
  role        text not null,
  email       text,
  created_at  timestamptz not null default now(),
  unique (deal_id, side)
);

create index if not exists deal_parties_deal_idx on public.deal_parties (deal_id);

-- ---------------------------------------------------------------------------
-- Certidões
-- ---------------------------------------------------------------------------

create table if not exists public.certificates (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  deal_id          uuid not null references public.deals (id) on delete cascade,
  name             text not null,
  origin           text not null,
  agency           text not null,
  requested_at     date,
  valid_until      date,
  -- nulo significa emissão gratuita
  cost             numeric(10, 2),
  status           text not null check (status in ('Recebida', 'Solicitada', 'Pendente', 'Vencida')),
  created_at       timestamptz not null default now()
);

create index if not exists certificates_organization_idx on public.certificates (organization_id);
create index if not exists certificates_deal_idx on public.certificates (deal_id);

-- ---------------------------------------------------------------------------
-- Contratos
-- ---------------------------------------------------------------------------

create table if not exists public.contracts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  deal_id          uuid not null references public.deals (id) on delete cascade,
  type             text not null check (type in ('Compra e Venda', 'Locação', 'Permuta', 'Auditoria')),
  version          text,
  owner_id         uuid references public.profiles (id) on delete set null,
  status           text not null check (status in ('Em revisão', 'Aguard. assinatura', 'Assinado', 'Não gerado')),
  updated_at       timestamptz,
  created_at       timestamptz not null default now(),
  unique (deal_id)
);

create index if not exists contracts_organization_idx on public.contracts (organization_id);

-- ---------------------------------------------------------------------------
-- Assinaturas
-- ---------------------------------------------------------------------------

create table if not exists public.signatures (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  contract_id      uuid not null references public.contracts (id) on delete cascade,
  name             text not null,
  email            text not null,
  role             text not null,
  sent_at          date,
  deadline         date,
  status           text not null check (status in ('Assinado', 'Aguardando')),
  created_at       timestamptz not null default now()
);

create index if not exists signatures_organization_idx on public.signatures (organization_id);
create index if not exists signatures_contract_idx on public.signatures (contract_id);

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------

create table if not exists public.audits (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  deal_id          uuid not null references public.deals (id) on delete cascade,
  verdict          text not null check (verdict in ('Aprovado', 'Atenção', 'Bloqueador')),
  created_at       timestamptz not null default now(),
  unique (deal_id)
);

create table if not exists public.audit_groups (
  id          uuid primary key default gen_random_uuid(),
  audit_id    uuid not null references public.audits (id) on delete cascade,
  label       text not null,
  done        integer not null default 0,
  total       integer not null,
  position    integer not null default 0
);

create index if not exists audits_organization_idx on public.audits (organization_id);
create index if not exists audit_groups_audit_idx on public.audit_groups (audit_id);

-- ---------------------------------------------------------------------------
-- Atividades e pendências
-- ---------------------------------------------------------------------------

create table if not exists public.activities (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  deal_id          uuid not null references public.deals (id) on delete cascade,
  title            text not null,
  kind             text not null check (kind in ('Contrato', 'Auditoria', 'Certidão', 'Documento')),
  status           text not null check (status in ('Em andamento', 'Aguard. assinatura', 'Bloqueado', 'Concluído')),
  occurred_at      timestamptz not null default now()
);

create index if not exists activities_organization_idx on public.activities (organization_id, occurred_at desc);

create table if not exists public.pendencies (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  deal_id          uuid not null references public.deals (id) on delete cascade,
  title            text not null,
  priority         text not null check (priority in ('Alta', 'Média', 'Baixa')),
  resolved         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists pendencies_organization_idx on public.pendencies (organization_id) where resolved = false;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Sem policy, RLS ligada nega tudo. Cada tabela libera apenas as linhas da
-- organização do usuário logado.
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.deals         enable row level security;
alter table public.deal_parties  enable row level security;
alter table public.certificates  enable row level security;
alter table public.contracts     enable row level security;
alter table public.signatures    enable row level security;
alter table public.audits        enable row level security;
alter table public.audit_groups  enable row level security;
alter table public.activities    enable row level security;
alter table public.pendencies    enable row level security;

drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = public.current_org_id());

-- Tabelas com organization_id direto seguem todas o mesmo padrão.
do $$
declare
  t text;
begin
  foreach t in array array[
    'deals', 'certificates', 'contracts', 'signatures',
    'audits', 'activities', 'pendencies'
  ]
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select to authenticated
         using (organization_id = public.current_org_id())', t, t);
  end loop;
end $$;

-- Filhas sem organization_id herdam o acesso pela linha pai.
drop policy if exists deal_parties_select on public.deal_parties;
create policy deal_parties_select on public.deal_parties
  for select to authenticated
  using (exists (
    select 1 from public.deals d
    where d.id = deal_parties.deal_id and d.organization_id = public.current_org_id()
  ));

drop policy if exists audit_groups_select on public.audit_groups;
create policy audit_groups_select on public.audit_groups
  for select to authenticated
  using (exists (
    select 1 from public.audits a
    where a.id = audit_groups.audit_id and a.organization_id = public.current_org_id()
  ));

-- Nota: só há policies de SELECT. Escrita ainda não é feita pelo app; quando
-- for, cada tabela precisará de policies de insert/update/delete com a mesma
-- checagem de organização.
