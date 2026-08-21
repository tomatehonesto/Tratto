-- Tratto — dados iniciais
--
-- Migra para o banco exatamente o conteúdo que estava em src/data/.
-- Rode DEPOIS de 0001_schema.sql.
--
-- O script liga o seu usuário do Auth a um perfil Admin. Sem esse vínculo a
-- função current_org_id() retorna nulo e a RLS não devolve nenhuma linha —
-- o app abriria vazio mesmo com dados no banco.
--
-- É idempotente: rodar de novo apaga a organização e recria do zero.

do $$
declare
  v_org        uuid;
  v_auth_id    uuid;
  v_auth_email text;
  v_auth_name  text;
begin
  -- Zera execuções anteriores. O cascade limpa todas as tabelas filhas.
  delete from public.organizations where name = 'Imobiliária Demonstração';

  insert into public.organizations (name, cnpj)
  values ('Imobiliária Demonstração', '48.912.774/0001-06')
  returning id into v_org;

  -- ---------------------------------------------------------------------
  -- Equipe
  -- ---------------------------------------------------------------------

  insert into public.profiles (organization_id, name, email, role, active, last_access) values
    (v_org, 'Mariana Costa',  'mariana@tratto.com.br',   'Jurídico', true,  now()),
    (v_org, 'Rodrigo Santos', 'rodrigo@imobiliaria.com', 'Corretor', true,  now()),
    (v_org, 'Camila Andrade', 'camila@imobiliaria.com',  'Corretor', true,  now() - interval '1 day'),
    (v_org, 'Ricardo Souza',  'ricardo@juridico.com',    'Jurídico', true,  now() - interval '3 days'),
    (v_org, 'Thiago Braga',   'thiago@imobiliaria.com',  'Corretor', false, now() - interval '20 days');

  -- Liga o usuário real (o primeiro criado no Auth) a um perfil Admin.
  select id, email, coalesce(raw_user_meta_data ->> 'name', split_part(email, '@', 1))
    into v_auth_id, v_auth_email, v_auth_name
  from auth.users
  order by created_at
  limit 1;

  if v_auth_id is not null then
    insert into public.profiles (organization_id, auth_user_id, name, email, role, active, last_access)
    values (v_org, v_auth_id, v_auth_name, v_auth_email, 'Admin', true, now());
  else
    raise notice 'Nenhum usuário em auth.users — crie um usuário e rode este bloco de novo.';
  end if;

  -- ---------------------------------------------------------------------
  -- Negócios
  -- ---------------------------------------------------------------------

  insert into public.deals
    (organization_id, reference, type, address, district, city, status, stage, progress, value, recurring, owner_id, updated_at)
  values
    (v_org, '#001', 'Compra e Venda', 'Rua Vergueiro, 1200 – Apto 302',      'Vila Mariana',     'São Paulo, SP', 'Em andamento',       'Certidões',            62,  850000, false, (select id from public.profiles where organization_id = v_org and name = 'Rodrigo Santos'), '2024-11-02'),
    (v_org, '#002', 'Locação',        'Al. Santos, 800 – Conj. 94',          'Jardins',          'São Paulo, SP', 'Aguard. assinatura', 'Assinatura',           88,   12500, true,  (select id from public.profiles where organization_id = v_org and name = 'Camila Andrade'), '2024-11-04'),
    (v_org, '#003', 'Compra e Venda', 'Av. Paulista, 2300 – Apto 151',       'Bela Vista',       'São Paulo, SP', 'Em andamento',       'Revisão',              75, 1200000, false, (select id from public.profiles where organization_id = v_org and name = 'Rodrigo Santos'), '2024-11-01'),
    (v_org, '#004', 'Compra e Venda', 'Rua Haddock Lobo, 595 – Apto 82',     'Cerqueira César',  'São Paulo, SP', 'Em andamento',       'Coleta de documentos', 35,  680000, false, (select id from public.profiles where organization_id = v_org and name = 'Camila Andrade'), '2024-11-05'),
    (v_org, '#005', 'Locação',        'Rua Oscar Freire, 2000 – Apto 41',    'Pinheiros',        'São Paulo, SP', 'Concluído',          'Finalizado',          100,    8200, true,  (select id from public.profiles where organization_id = v_org and name = 'Thiago Braga'),  '2024-10-28'),
    (v_org, '#006', 'Compra e Venda', 'Rua Funchal, 418 – Sala 501',         'Vila Olímpia',     'São Paulo, SP', 'Bloqueado',          'Certidões',            48, 1450000, false, (select id from public.profiles where organization_id = v_org and name = 'Rodrigo Santos'), '2024-10-30');

  -- ---------------------------------------------------------------------
  -- Partes
  -- ---------------------------------------------------------------------

  insert into public.deal_parties (deal_id, side, name, role) values
    ((select id from public.deals where organization_id = v_org and reference = '#001'), 'buyer',  'Carlos Eduardo',    'Comprador'),
    ((select id from public.deals where organization_id = v_org and reference = '#001'), 'seller', 'Ana Paula',         'Vendedor'),
    ((select id from public.deals where organization_id = v_org and reference = '#002'), 'buyer',  'Fernanda Oliveira', 'Locatário'),
    ((select id from public.deals where organization_id = v_org and reference = '#002'), 'seller', 'Pedro Augusto',     'Locador'),
    ((select id from public.deals where organization_id = v_org and reference = '#003'), 'buyer',  'Marcos Vinícius',   'Comprador'),
    ((select id from public.deals where organization_id = v_org and reference = '#003'), 'seller', 'Claudia Regina',    'Vendedor'),
    ((select id from public.deals where organization_id = v_org and reference = '#004'), 'buyer',  'Beatriz Souza',     'Comprador'),
    ((select id from public.deals where organization_id = v_org and reference = '#004'), 'seller', 'Hugo Nascimento',   'Vendedor'),
    ((select id from public.deals where organization_id = v_org and reference = '#005'), 'buyer',  'Lucas Ferreira',    'Locatário'),
    ((select id from public.deals where organization_id = v_org and reference = '#005'), 'seller', 'Renata Melo',       'Locador'),
    ((select id from public.deals where organization_id = v_org and reference = '#006'), 'buyer',  'Grupo Ipê',         'Comprador'),
    ((select id from public.deals where organization_id = v_org and reference = '#006'), 'seller', 'Sofia Yamada',      'Vendedor');

  -- ---------------------------------------------------------------------
  -- Certidões
  -- ---------------------------------------------------------------------

  insert into public.certificates
    (organization_id, deal_id, name, origin, agency, requested_at, valid_until, cost, status)
  values
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#001'), 'CND Federal',            'Comprador',  'Receita Federal',   '2024-10-22', '2025-04-24', null, 'Recebida'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#001'), 'Certidão IPTU',          'Imóvel',     'Prefeitura de SP',  '2024-10-22', '2025-01-23', null, 'Recebida'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#001'), 'Certidão PGM',           'Imóvel',     'PGM SP',            '2024-10-22', null,          45, 'Solicitada'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#001'), 'Certidão de Ônus Reais', 'Imóvel',     'CRI — 9º Oficial',  '2024-10-22', null,         120, 'Solicitada'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#002'), 'CND Federal',            'Locatário',  'Receita Federal',   '2024-10-23', '2025-04-25', null, 'Recebida'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#002'), 'Dist. Cível',            'Locatário',  'TJSP',              '2024-10-23', '2025-04-26',  30, 'Recebida'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#003'), 'Certidão de Ônus Reais', 'Imóvel',     'CRI — 1º Oficial',  '2024-10-01', '2025-04-04', 120, 'Recebida'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#003'), 'CND Federal',            'Vendedor',   'Receita Federal',   '2024-10-01', '2025-04-03', null, 'Recebida'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#004'), 'Certidão IPTU',          'Imóvel',     'Prefeitura de SP',  '2024-11-03', null,        null, 'Solicitada'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#006'), 'Certidão IPTU',          'Imóvel',     'Prefeitura de SP',  '2024-10-08', '2024-10-09', null, 'Vencida'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#006'), 'Certidão de Ônus Reais', 'Imóvel',     'CRI — 5º Oficial',  '2024-10-08', null,         120, 'Pendente');

  -- ---------------------------------------------------------------------
  -- Contratos
  -- ---------------------------------------------------------------------

  insert into public.contracts (organization_id, deal_id, type, version, owner_id, status, updated_at) values
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#001'), 'Compra e Venda', 'v3',  (select id from public.profiles where organization_id = v_org and name = 'Mariana Costa'), 'Em revisão',         '2024-11-01'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#002'), 'Locação',        'v2',  (select id from public.profiles where organization_id = v_org and name = 'Ricardo Souza'), 'Aguard. assinatura', '2024-11-03'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#003'), 'Compra e Venda', 'v4',  (select id from public.profiles where organization_id = v_org and name = 'Mariana Costa'), 'Em revisão',         '2024-11-01'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#004'), 'Compra e Venda', null,  null,                                                                                     'Não gerado',         null),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#005'), 'Locação',        'v2',  (select id from public.profiles where organization_id = v_org and name = 'Mariana Costa'), 'Assinado',           '2024-10-25'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#006'), 'Compra e Venda', 'v1',  null,                                                                                     'Em revisão',         '2024-10-28');

  -- ---------------------------------------------------------------------
  -- Assinaturas
  -- ---------------------------------------------------------------------

  insert into public.signatures (organization_id, contract_id, name, email, role, sent_at, deadline, status) values
    (v_org, (select c.id from public.contracts c join public.deals d on d.id = c.deal_id where d.organization_id = v_org and d.reference = '#002'), 'Fernanda Oliveira Lima', 'fernanda.lima@email.com',   'Locatário',  '2024-11-03', '2024-11-20', 'Aguardando'),
    (v_org, (select c.id from public.contracts c join public.deals d on d.id = c.deal_id where d.organization_id = v_org and d.reference = '#002'), 'Pedro Augusto Ramos',    'pedramos@gmail.com',        'Locador',    '2024-11-03', '2024-11-20', 'Aguardando'),
    (v_org, (select c.id from public.contracts c join public.deals d on d.id = c.deal_id where d.organization_id = v_org and d.reference = '#002'), 'Dr. Ricardo Souza',      'juridico@tratto.com.br',    'Testemunha', '2024-11-03', '2024-11-20', 'Assinado'),
    (v_org, (select c.id from public.contracts c join public.deals d on d.id = c.deal_id where d.organization_id = v_org and d.reference = '#003'), 'Marcos Vinícius Telles', 'mv.telles@corp.com.br',     'Comprador',  '2024-11-01', '2024-12-01', 'Assinado'),
    (v_org, (select c.id from public.contracts c join public.deals d on d.id = c.deal_id where d.organization_id = v_org and d.reference = '#003'), 'Claudia Regina Nunes',   'claudia.nunes@gmail.com',   'Vendedor',   '2024-11-01', '2024-12-01', 'Aguardando'),
    (v_org, (select c.id from public.contracts c join public.deals d on d.id = c.deal_id where d.organization_id = v_org and d.reference = '#005'), 'Lucas Ferreira',         'lucas.f@design.io',         'Locatário',  '2024-10-25', '2024-11-10', 'Assinado'),
    (v_org, (select c.id from public.contracts c join public.deals d on d.id = c.deal_id where d.organization_id = v_org and d.reference = '#005'), 'Renata Melo',            'renata.melo@gmail.com',     'Locador',    '2024-10-25', '2024-11-10', 'Assinado');

  -- ---------------------------------------------------------------------
  -- Auditoria
  -- ---------------------------------------------------------------------

  insert into public.audits (organization_id, deal_id, verdict) values
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#001'), 'Bloqueador'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#002'), 'Atenção'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#003'), 'Atenção'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#004'), 'Bloqueador'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#005'), 'Aprovado'),
    (v_org, (select id from public.deals where organization_id = v_org and reference = '#006'), 'Bloqueador');

  insert into public.audit_groups (audit_id, label, done, total, position)
  select a.id, g.label, g.done, g.total, g.position
  from public.audits a
  join public.deals d on d.id = a.deal_id
  join (values
    ('#001', 'Comprador',              2, 5, 0),
    ('#001', 'Vendedor',               2, 7, 1),
    ('#001', 'Imóvel',                 2, 5, 2),
    ('#002', 'Locatário',              4, 5, 0),
    ('#002', 'Locador / Proprietário', 3, 3, 1),
    ('#002', 'Imóvel',                 4, 4, 2),
    ('#003', 'Comprador',              5, 5, 0),
    ('#003', 'Vendedor',               6, 7, 1),
    ('#003', 'Imóvel',                 4, 5, 2),
    ('#004', 'Comprador',              0, 5, 0),
    ('#004', 'Vendedor',               0, 7, 1),
    ('#004', 'Imóvel',                 0, 5, 2),
    ('#005', 'Locatário',              5, 5, 0),
    ('#005', 'Locador / Proprietário', 3, 3, 1),
    ('#005', 'Imóvel',                 4, 4, 2),
    ('#006', 'Comprador',              2, 5, 0),
    ('#006', 'Vendedor',               3, 7, 1),
    ('#006', 'Imóvel',                 2, 5, 2)
  ) as g(reference, label, done, total, position) on g.reference = d.reference
  where a.organization_id = v_org;

  -- ---------------------------------------------------------------------
  -- Atividades
  -- ---------------------------------------------------------------------

  insert into public.activities (organization_id, deal_id, title, kind, status, occurred_at)
  select v_org, d.id, a.title, a.kind, a.status, now() - a.ago
  from public.deals d
  join (values
    ('#002', 'Contrato enviado para assinatura',        'Contrato',  'Aguard. assinatura', interval '12 minutes'),
    ('#003', 'Auditoria jurídica concluída',            'Auditoria', 'Em andamento',       interval '45 minutes'),
    ('#001', 'Certidão de Ônus Reais recebida',         'Certidão',  'Em andamento',       interval '2 hours'),
    ('#003', 'Contrato v4 gerado automaticamente',      'Contrato',  'Em andamento',       interval '3 hours'),
    ('#004', 'Comprador enviou documentos',             'Documento', 'Em andamento',       interval '1 day'),
    ('#001', 'Documento de identidade atualizado',      'Documento', 'Em andamento',       interval '1 day 2 hours'),
    ('#006', 'Certidão IPTU vencida — ação necessária', 'Certidão',  'Bloqueado',          interval '1 day 5 hours')
  ) as a(reference, title, kind, status, ago) on a.reference = d.reference
  where d.organization_id = v_org;

  -- ---------------------------------------------------------------------
  -- Pendências
  -- ---------------------------------------------------------------------

  insert into public.pendencies (organization_id, deal_id, title, priority)
  select v_org, d.id, p.title, p.priority
  from public.deals d
  join (values
    ('#006', 'Certidão IPTU vencida',              'Alta'),
    ('#002', 'Comprador não assinou — prazo hoje', 'Alta'),
    ('#004', 'Vendedor não enviou matrícula',      'Média'),
    ('#001', 'Certidão PGM pendente (5 dias)',     'Média')
  ) as p(reference, title, priority) on p.reference = d.reference
  where d.organization_id = v_org;

  raise notice 'Seed concluído. Organização: %', v_org;
end $$;
