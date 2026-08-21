-- Tratto — privilégios de tabela
--
-- Com "Automatically expose new tables" desligado no projeto, tabelas criadas
-- por SQL nascem sem GRANT para os papéis da API. A RLS sozinha não basta:
-- sem privilégio, o PostgREST devolve 42501 (insufficient_privilege) mesmo
-- para usuário autenticado.
--
-- Concedemos SELECT apenas a `authenticated`. `anon` fica de fora de
-- propósito: quem não fez login não deve enxergar nada, e negar no nível de
-- privilégio é uma camada a mais além da RLS.

grant usage on schema public to authenticated;

grant select on
  public.organizations,
  public.profiles,
  public.deals,
  public.deal_parties,
  public.certificates,
  public.contracts,
  public.signatures,
  public.audits,
  public.audit_groups,
  public.activities,
  public.pendencies
to authenticated;

-- Garante que anon não tenha acesso, mesmo que algo tenha concedido antes.
revoke all on
  public.organizations,
  public.profiles,
  public.deals,
  public.deal_parties,
  public.certificates,
  public.contracts,
  public.signatures,
  public.audits,
  public.audit_groups,
  public.activities,
  public.pendencies
from anon;

-- current_org_id() é chamada dentro das policies; o usuário precisa poder executá-la.
grant execute on function public.current_org_id() to authenticated;
revoke execute on function public.current_org_id() from anon, public;

-- Tabelas futuras criadas por este papel já nascem com o mesmo padrão.
alter default privileges in schema public grant select on tables to authenticated;
