-- Tratto — cadastro self-service e escrita de negócios
--
-- Rode depois de 0003_grants.sql.

-- ---------------------------------------------------------------------------
-- Provisionamento no cadastro
--
-- Quem se cadastra informa a imobiliária e vira Admin de uma organização nova.
-- Entrar numa organização existente é por convite, nunca por escolha no
-- cadastro: se bastasse digitar o nome, qualquer pessoa entraria na conta de
-- uma imobiliária real e leria a due diligence inteira dela.
--
-- SECURITY DEFINER porque o gatilho roda no contexto do usuário recém-criado,
-- que ainda não tem privilégio nenhum nas tabelas de public.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org  uuid;
  v_name text;
begin
  -- Já tem perfil? Nada a fazer (reexecução, ou usuário criado pelo painel).
  if exists (select 1 from public.profiles where auth_user_id = new.id) then
    return new;
  end if;

  insert into public.organizations (name, cnpj)
  values (
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''), 'Minha imobiliária'),
    nullif(trim(new.raw_user_meta_data ->> 'cnpj'), '')
  )
  returning id into v_org;

  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Usuário'
  );

  insert into public.profiles (organization_id, auth_user_id, name, email, role, active, last_access)
  values (v_org, new.id, v_name, coalesce(new.email, ''), 'Admin', true, now());

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Numeração dos negócios
--
-- A referência (#001) é sequencial por organização. Gerar no banco evita duas
-- pessoas da mesma imobiliária criarem #007 ao mesmo tempo.
-- ---------------------------------------------------------------------------

create or replace function public.set_deal_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null or trim(new.reference) = '' then
    select '#' || lpad((coalesce(max(nullif(regexp_replace(reference, '\D', '', 'g'), '')::int), 0) + 1)::text, 3, '0')
      into new.reference
    from public.deals
    where organization_id = new.organization_id;
  end if;
  return new;
end $$;

drop trigger if exists deals_set_reference on public.deals;
create trigger deals_set_reference
  before insert on public.deals
  for each row execute function public.set_deal_reference();

alter table public.deals alter column reference drop not null;

-- O cliente não precisa saber o id da própria organização.
alter table public.deals        alter column organization_id set default public.current_org_id();
alter table public.certificates alter column organization_id set default public.current_org_id();
alter table public.contracts    alter column organization_id set default public.current_org_id();
alter table public.activities   alter column organization_id set default public.current_org_id();
alter table public.pendencies   alter column organization_id set default public.current_org_id();

-- ---------------------------------------------------------------------------
-- Policies de escrita
--
-- `with check` impede gravar linha em outra organização — inclusive numa
-- tentativa deliberada de passar organization_id alheio no payload.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['deals', 'certificates', 'contracts', 'activities', 'pendencies']
  loop
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated
         with check (organization_id = public.current_org_id())', t, t);

    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format(
      'create policy %I_update on public.%I for update to authenticated
         using (organization_id = public.current_org_id())
         with check (organization_id = public.current_org_id())', t, t);
  end loop;
end $$;

-- Partes herdam a checagem pela linha pai.
drop policy if exists deal_parties_insert on public.deal_parties;
create policy deal_parties_insert on public.deal_parties
  for insert to authenticated
  with check (exists (
    select 1 from public.deals d
    where d.id = deal_parties.deal_id and d.organization_id = public.current_org_id()
  ));

drop policy if exists deal_parties_update on public.deal_parties;
create policy deal_parties_update on public.deal_parties
  for update to authenticated
  using (exists (
    select 1 from public.deals d
    where d.id = deal_parties.deal_id and d.organization_id = public.current_org_id()
  ))
  with check (exists (
    select 1 from public.deals d
    where d.id = deal_parties.deal_id and d.organization_id = public.current_org_id()
  ));

-- ---------------------------------------------------------------------------
-- Criação de negócio
--
-- Negócio e partes precisam nascer juntos. O PostgREST não expõe transação,
-- então duas chamadas separadas do cliente poderiam deixar um negócio sem
-- partes se a segunda falhasse. Dentro de uma função tudo roda numa transação
-- só, e um erro desfaz o conjunto.
--
-- SECURITY INVOKER (padrão) de propósito: a função roda com os privilégios de
-- quem chamou, então as policies de RLS continuam valendo. Um SECURITY DEFINER
-- aqui abriria caminho para gravar em qualquer organização.
-- ---------------------------------------------------------------------------

create or replace function public.create_deal(
  p_type        text,
  p_address     text,
  p_district    text,
  p_city        text,
  p_value       numeric,
  p_recurring   boolean,
  p_stage       text,
  p_buyer_name  text,
  p_buyer_role  text,
  p_seller_name text,
  p_seller_role text
)
returns text
language plpgsql
as $$
declare
  v_org  uuid;
  v_deal uuid;
  v_ref  text;
begin
  v_org := public.current_org_id();
  if v_org is null then
    raise exception 'Usuário não está vinculado a nenhuma imobiliária.';
  end if;

  insert into public.deals
    (organization_id, type, address, district, city, status, stage, progress, value, recurring)
  values
    (v_org, p_type, p_address, nullif(trim(p_district), ''), nullif(trim(p_city), ''),
     'Em andamento', p_stage, 0, p_value, coalesce(p_recurring, false))
  returning id, reference into v_deal, v_ref;

  insert into public.deal_parties (deal_id, side, name, role) values
    (v_deal, 'buyer',  p_buyer_name,  p_buyer_role),
    (v_deal, 'seller', p_seller_name, p_seller_role);

  return v_ref;
end $$;

revoke execute on function public.create_deal(
  text, text, text, text, numeric, boolean, text, text, text, text, text
) from anon, public;

grant execute on function public.create_deal(
  text, text, text, text, numeric, boolean, text, text, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Privilégios de escrita
--
-- Deliberadamente ausentes: DELETE em qualquer tabela, e escrita em
-- organizations/profiles. Apagar negócio e gerenciar equipe são operações que
-- ainda não têm tela nem regra de permissão definida.
-- ---------------------------------------------------------------------------

grant insert, update on
  public.deals,
  public.deal_parties,
  public.certificates,
  public.contracts,
  public.activities,
  public.pendencies
to authenticated;
