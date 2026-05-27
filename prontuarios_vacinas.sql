-- ── Prontuário do pet ──────────────────────────────────────────────────────────
-- Rodar no SQL Editor do Supabase

-- 1. Tabela prontuarios (saúde + comportamento — 1 por pet)
create table if not exists prontuarios (
  id                        uuid        primary key default gen_random_uuid(),
  petshop_id                uuid        not null references petshops(id) on delete cascade,
  pet_id                    uuid        not null references pets(id)     on delete cascade,
  -- Saúde
  alergias                  text,
  condicoes_especiais       text,
  medicamentos              text,
  veterinario               text,
  -- Comportamento
  nivel_agitacao            text        check (nivel_agitacao in ('calmo','normal','agitado','agressivo')),
  aceita_outros_animais     boolean     not null default true,
  observacoes_comportamento text,
  -- Auditoria
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (pet_id)
);

alter table prontuarios enable row level security;

create policy "petshop_prontuarios"
  on prontuarios for all
  using  (petshop_id = get_petshop_id())
  with check (petshop_id = get_petshop_id());

-- 2. Tabela vacinas
create table if not exists vacinas (
  id               uuid        primary key default gen_random_uuid(),
  petshop_id       uuid        not null references petshops(id) on delete cascade,
  pet_id           uuid        not null references pets(id)     on delete cascade,
  nome             text        not null,
  data_aplicacao   date        not null,
  data_vencimento  date,
  created_at       timestamptz not null default now()
);

alter table vacinas enable row level security;

create policy "petshop_vacinas"
  on vacinas for all
  using  (petshop_id = get_petshop_id())
  with check (petshop_id = get_petshop_id());
