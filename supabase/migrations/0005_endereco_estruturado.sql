-- Tratto — endereço estruturado
--
-- `address` continua sendo a linha exibida nas listagens, mas passa a conviver
-- com as partes separadas. Guardar estruturado importa numa plataforma de due
-- diligence: cruzar com matrícula, emitir ITBI e conferir IPTU dependem de CEP
-- e número, não de uma string.
--
-- Colunas nulas de propósito: as linhas criadas antes desta migration não têm
-- como ser decompostas, e forçar preenchimento quebraria o seed.

alter table public.deals add column if not exists cep        text;
alter table public.deals add column if not exists street     text;
alter table public.deals add column if not exists number     text;
alter table public.deals add column if not exists complement text;
alter table public.deals add column if not exists uf         text;

-- Aceita só os 8 dígitos, sem hífen — a formatação é responsabilidade da interface.
alter table public.deals drop constraint if exists deals_cep_format;
alter table public.deals add  constraint deals_cep_format
  check (cep is null or cep ~ '^\d{8}$');

create index if not exists deals_cep_idx on public.deals (organization_id, cep);

-- ---------------------------------------------------------------------------
-- create_deal passa a receber o endereço decomposto.
--
-- A assinatura antiga é removida: manter as duas criaria sobrecarga ambígua e
-- o PostgREST erraria a resolução.
-- ---------------------------------------------------------------------------

drop function if exists public.create_deal(
  text, text, text, text, numeric, boolean, text, text, text, text, text
);

create or replace function public.create_deal(
  p_type        text,
  p_address     text,
  p_cep         text,
  p_street      text,
  p_number      text,
  p_complement  text,
  p_district    text,
  p_city        text,
  p_uf          text,
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
    (organization_id, type, address, cep, street, number, complement,
     district, city, uf, status, stage, progress, value, recurring)
  values
    (v_org, p_type, p_address,
     nullif(regexp_replace(coalesce(p_cep, ''), '\D', '', 'g'), ''),
     nullif(trim(p_street), ''),
     nullif(trim(p_number), ''),
     nullif(trim(p_complement), ''),
     nullif(trim(p_district), ''),
     nullif(trim(p_city), ''),
     nullif(upper(trim(p_uf)), ''),
     'Em andamento', p_stage, 0, p_value, coalesce(p_recurring, false))
  returning id, reference into v_deal, v_ref;

  insert into public.deal_parties (deal_id, side, name, role) values
    (v_deal, 'buyer',  p_buyer_name,  p_buyer_role),
    (v_deal, 'seller', p_seller_name, p_seller_role);

  return v_ref;
end $$;

revoke execute on function public.create_deal(
  text, text, text, text, text, text, text, text, text,
  numeric, boolean, text, text, text, text, text
) from anon, public;

grant execute on function public.create_deal(
  text, text, text, text, text, text, text, text, text,
  numeric, boolean, text, text, text, text, text
) to authenticated;
