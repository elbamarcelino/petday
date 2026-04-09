-- ============================================================
-- PetDay — Schema do banco de dados (Supabase / PostgreSQL)
-- ============================================================

-- Habilita UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- CLIENTES
-- ============================================================
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  email       text unique not null,
  telefone    text not null,
  endereco    text,
  created_at  timestamptz not null default now()
);

alter table public.clientes enable row level security;

create policy "Usuários autenticados podem ver clientes"
  on public.clientes for select
  to authenticated using (true);

create policy "Usuários autenticados podem inserir clientes"
  on public.clientes for insert
  to authenticated with check (true);

create policy "Usuários autenticados podem atualizar clientes"
  on public.clientes for update
  to authenticated using (true);

-- ============================================================
-- PETS
-- ============================================================
create type public.porte_enum as enum ('pequeno', 'medio', 'grande');

create table public.pets (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clientes(id) on delete cascade,
  nome         text not null,
  especie      text not null,
  raca         text,
  porte        public.porte_enum not null default 'medio',
  nascimento   date,
  observacoes  text,
  created_at   timestamptz not null default now()
);

alter table public.pets enable row level security;

create policy "Usuários autenticados podem ver pets"
  on public.pets for select
  to authenticated using (true);

create policy "Usuários autenticados podem inserir pets"
  on public.pets for insert
  to authenticated with check (true);

create policy "Usuários autenticados podem atualizar pets"
  on public.pets for update
  to authenticated using (true);

-- ============================================================
-- SERVIÇOS
-- ============================================================
create type public.tipo_servico_enum as enum (
  'banho', 'tosa', 'banho_e_tosa', 'consulta', 'vacina'
);

create table public.servicos (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  tipo              public.tipo_servico_enum not null,
  descricao         text,
  preco             numeric(10, 2) not null check (preco >= 0),
  duracao_minutos   integer not null check (duracao_minutos > 0),
  ativo             boolean not null default true
);

alter table public.servicos enable row level security;

create policy "Usuários autenticados podem ver serviços"
  on public.servicos for select
  to authenticated using (true);

create policy "Usuários autenticados podem gerenciar serviços"
  on public.servicos for all
  to authenticated using (true);

-- ============================================================
-- AGENDAMENTOS
-- ============================================================
create type public.status_agendamento_enum as enum (
  'pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado'
);

create table public.agendamentos (
  id             uuid primary key default gen_random_uuid(),
  pet_id         uuid not null references public.pets(id) on delete cascade,
  servico_id     uuid not null references public.servicos(id),
  data_hora      timestamptz not null,
  status         public.status_agendamento_enum not null default 'pendente',
  observacoes    text,
  preco_cobrado  numeric(10, 2) not null check (preco_cobrado >= 0),
  created_at     timestamptz not null default now()
);

alter table public.agendamentos enable row level security;

create policy "Usuários autenticados podem ver agendamentos"
  on public.agendamentos for select
  to authenticated using (true);

create policy "Usuários autenticados podem inserir agendamentos"
  on public.agendamentos for insert
  to authenticated with check (true);

create policy "Usuários autenticados podem atualizar agendamentos"
  on public.agendamentos for update
  to authenticated using (true);

-- ============================================================
-- DADOS DE EXEMPLO
-- ============================================================
insert into public.servicos (nome, tipo, descricao, preco, duracao_minutos, ativo) values
  ('Banho Pequeno Porte',      'banho',        'Banho completo para pets pequenos',    45.00,  60,  true),
  ('Banho Médio Porte',        'banho',        'Banho completo para pets médios',       65.00,  75,  true),
  ('Banho Grande Porte',       'banho',        'Banho completo para pets grandes',      85.00,  90,  true),
  ('Tosa Higiênica',           'tosa',         'Tosa das regiões higiênicas',           35.00,  30,  true),
  ('Tosa Completa Pequeno',    'tosa',         'Tosa completa para pequenos',           60.00,  60,  true),
  ('Banho e Tosa Pequeno',     'banho_e_tosa', 'Pacote banho + tosa pequeno porte',    80.00,  90,  true),
  ('Banho e Tosa Médio',       'banho_e_tosa', 'Pacote banho + tosa médio porte',     110.00, 120,  true),
  ('Banho e Tosa Grande',      'banho_e_tosa', 'Pacote banho + tosa grande porte',    150.00, 150,  true);
