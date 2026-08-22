-- Tratto — convites das partes e upload de documentos
--
-- Comprador e vendedor não têm conta na plataforma: recebem um link com token
-- e enviam os documentos por uma página pública. Todo acesso deles é validado
-- pelo token, nunca por sessão.

-- ---------------------------------------------------------------------------
-- Campos novos do negócio
-- ---------------------------------------------------------------------------

alter table public.deals add column if not exists modality    text;
alter table public.deals add column if not exists broker_name text;
alter table public.deals add column if not exists lawyer_name text;

alter table public.deals drop constraint if exists deals_modality_check;
alter table public.deals add  constraint deals_modality_check
  check (modality is null or modality in ('Direta', 'Financiamento'));

alter table public.deal_parties add column if not exists phone text;

-- ---------------------------------------------------------------------------
-- Convites
-- ---------------------------------------------------------------------------

create table if not exists public.party_invites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  deal_id          uuid not null references public.deals (id) on delete cascade,
  party_id         uuid not null references public.deal_parties (id) on delete cascade,
  -- 64 caracteres hex: inadivinhável na prática.
  token            text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at       timestamptz not null default now() + interval '30 days',
  sent_at          timestamptz,
  first_opened_at  timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (party_id)
);

create index if not exists party_invites_token_idx on public.party_invites (token);
create index if not exists party_invites_deal_idx  on public.party_invites (deal_id);

-- ---------------------------------------------------------------------------
-- Documentos enviados
-- ---------------------------------------------------------------------------

create table if not exists public.party_documents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  deal_id          uuid not null references public.deals (id) on delete cascade,
  party_id         uuid not null references public.deal_parties (id) on delete cascade,
  doc_name         text not null,
  storage_path     text not null unique,
  mime_type        text,
  size_bytes       bigint,
  uploaded_at      timestamptz not null default now()
);

create index if not exists party_documents_deal_idx on public.party_documents (deal_id);

-- ---------------------------------------------------------------------------
-- Bucket privado
--
-- `public = false`: nenhum arquivo tem URL aberta. A equipe lê por URL
-- assinada, com validade curta. CNH e matrícula não podem ficar acessíveis
-- por endereço adivinhável.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deal-documents', 'deal-documents', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Validação de token
--
-- SECURITY DEFINER: chamada por visitante anônimo, que não tem privilégio
-- nenhum em public. Retorna apenas se o token serve, nada mais.
-- ---------------------------------------------------------------------------

create or replace function public.invite_token_valid(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.party_invites
    where token = p_token and expires_at > now()
  )
$$;

revoke execute on function public.invite_token_valid(text) from public;
grant execute on function public.invite_token_valid(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Dados do convite
--
-- Devolve só o necessário para a página de upload: quem é a pessoa, qual o
-- imóvel e o que já foi enviado. Nada de valor do negócio, partes contrárias
-- ou dados da imobiliária além do nome.
-- ---------------------------------------------------------------------------

create or replace function public.invite_details(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v json;
begin
  update public.party_invites
     set first_opened_at = coalesce(first_opened_at, now())
   where token = p_token and expires_at > now();

  select json_build_object(
    'party_name',   pt.name,
    'party_role',   pt.role,
    'party_side',   pt.side,
    'deal_type',    d.type,
    'deal_modality', d.modality,
    'address',      d.address,
    'city',         d.city,
    'organization', o.name,
    'expires_at',   i.expires_at,
    'completed',    i.completed_at is not null,
    'documents',    coalesce(
      (select json_agg(json_build_object('name', pd.doc_name, 'uploaded_at', pd.uploaded_at)
              order by pd.uploaded_at)
         from public.party_documents pd where pd.party_id = pt.id),
      '[]'::json)
  )
    into v
  from public.party_invites i
  join public.deal_parties  pt on pt.id = i.party_id
  join public.deals         d  on d.id  = i.deal_id
  join public.organizations o  on o.id  = i.organization_id
  where i.token = p_token and i.expires_at > now();

  return v; -- nulo quando o token não existe ou expirou
end $$;

revoke execute on function public.invite_details(text) from public;
grant execute on function public.invite_details(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Registro de documento enviado
-- ---------------------------------------------------------------------------

create or replace function public.invite_register_document(
  p_token     text,
  p_doc_name  text,
  p_path      text,
  p_mime      text,
  p_size      bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.party_invites%rowtype;
begin
  select * into v_inv from public.party_invites
   where token = p_token and expires_at > now();

  if not found then
    raise exception 'Convite inválido ou expirado.';
  end if;

  -- O caminho tem de começar pelo token: impede registrar arquivo de outro.
  if p_path not like p_token || '/%' then
    raise exception 'Caminho inválido.';
  end if;

  insert into public.party_documents
    (organization_id, deal_id, party_id, doc_name, storage_path, mime_type, size_bytes)
  values
    (v_inv.organization_id, v_inv.deal_id, v_inv.party_id, p_doc_name, p_path, p_mime, p_size);
end $$;

revoke execute on function public.invite_register_document(text, text, text, text, bigint) from public;
grant execute on function public.invite_register_document(text, text, text, text, bigint) to anon;

-- ---------------------------------------------------------------------------
-- Policies do Storage
--
-- Arquivos vivem em `{token}/{arquivo}`. O visitante anônimo só escreve dentro
-- da pasta do próprio token, e não consegue ler nada — nem o que enviou.
-- ---------------------------------------------------------------------------

drop policy if exists "convite envia documento" on storage.objects;
create policy "convite envia documento" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'deal-documents'
    and public.invite_token_valid((storage.foldername(name))[1])
  );

drop policy if exists "equipe le documentos" on storage.objects;
create policy "equipe le documentos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'deal-documents'
    and exists (
      select 1 from public.party_documents pd
      where pd.storage_path = storage.objects.name
        and pd.organization_id = public.current_org_id()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS das tabelas novas
-- ---------------------------------------------------------------------------

alter table public.party_invites   enable row level security;
alter table public.party_documents enable row level security;

drop policy if exists party_invites_select on public.party_invites;
create policy party_invites_select on public.party_invites
  for select to authenticated
  using (organization_id = public.current_org_id());

drop policy if exists party_invites_update on public.party_invites;
create policy party_invites_update on public.party_invites
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists party_documents_select on public.party_documents;
create policy party_documents_select on public.party_documents
  for select to authenticated
  using (organization_id = public.current_org_id());

grant select, update on public.party_invites   to authenticated;
grant select          on public.party_documents to authenticated;

-- ---------------------------------------------------------------------------
-- create_deal ganha os campos do passo 1 e 2, e já cria os convites
-- ---------------------------------------------------------------------------

drop function if exists public.create_deal(
  text, text, text, text, text, text, text, text, text,
  numeric, boolean, text, text, text, text, text
);

create or replace function public.create_deal(
  p_type         text,
  p_modality     text,
  p_address      text,
  p_cep          text,
  p_street       text,
  p_number       text,
  p_complement   text,
  p_district     text,
  p_city         text,
  p_uf           text,
  p_broker_name  text,
  p_lawyer_name  text,
  p_value        numeric,
  p_recurring    boolean,
  p_stage        text,
  p_buyer_name   text,
  p_buyer_role   text,
  p_buyer_email  text,
  p_buyer_phone  text,
  p_seller_name  text,
  p_seller_role  text,
  p_seller_email text,
  p_seller_phone text
)
returns json
language plpgsql
as $$
declare
  v_org       uuid;
  v_deal      uuid;
  v_ref       text;
  v_buyer     uuid;
  v_seller    uuid;
  v_tok_buyer text;
  v_tok_sell  text;
begin
  v_org := public.current_org_id();
  if v_org is null then
    raise exception 'Usuário não está vinculado a nenhuma imobiliária.';
  end if;

  insert into public.deals
    (organization_id, type, modality, address, cep, street, number, complement,
     district, city, uf, broker_name, lawyer_name, status, stage, progress, value, recurring)
  values
    (v_org, p_type, nullif(trim(p_modality), ''), p_address,
     nullif(regexp_replace(coalesce(p_cep, ''), '\D', '', 'g'), ''),
     nullif(trim(p_street), ''), nullif(trim(p_number), ''), nullif(trim(p_complement), ''),
     nullif(trim(p_district), ''), nullif(trim(p_city), ''), nullif(upper(trim(p_uf)), ''),
     nullif(trim(p_broker_name), ''), nullif(trim(p_lawyer_name), ''),
     'Em andamento', p_stage, 0, p_value, coalesce(p_recurring, false))
  returning id, reference into v_deal, v_ref;

  insert into public.deal_parties (deal_id, side, name, role, email, phone)
  values (v_deal, 'buyer', p_buyer_name, p_buyer_role,
          nullif(trim(p_buyer_email), ''), nullif(trim(p_buyer_phone), ''))
  returning id into v_buyer;

  insert into public.deal_parties (deal_id, side, name, role, email, phone)
  values (v_deal, 'seller', p_seller_name, p_seller_role,
          nullif(trim(p_seller_email), ''), nullif(trim(p_seller_phone), ''))
  returning id into v_seller;

  insert into public.party_invites (organization_id, deal_id, party_id)
  values (v_org, v_deal, v_buyer)  returning token into v_tok_buyer;

  insert into public.party_invites (organization_id, deal_id, party_id)
  values (v_org, v_deal, v_seller) returning token into v_tok_sell;

  return json_build_object(
    'reference',    v_ref,
    'buyer_token',  v_tok_buyer,
    'seller_token', v_tok_sell
  );
end $$;

revoke execute on function public.create_deal(
  text, text, text, text, text, text, text, text, text, text, text, text,
  numeric, boolean, text, text, text, text, text, text, text, text, text
) from anon, public;

grant execute on function public.create_deal(
  text, text, text, text, text, text, text, text, text, text, text, text,
  numeric, boolean, text, text, text, text, text, text, text, text, text
) to authenticated;

grant insert on public.party_invites to authenticated;
