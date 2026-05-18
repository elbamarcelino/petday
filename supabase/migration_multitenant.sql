-- ============================================================
-- PetDay — Multi-tenant schema (reset limpo)
-- Execute completo no SQL Editor do Supabase
-- ============================================================

-- Limpa tudo na ordem correta (FK aware)
drop table if exists public.agendamento_servicos cascade;
drop table if exists public.agendamentos        cascade;
drop table if exists public.servicos            cascade;
drop table if exists public.pets                cascade;
drop table if exists public.clientes            cascade;
drop table if exists public.usuarios            cascade;
drop table if exists public.petshops            cascade;

drop type if exists public.status_agendamento_enum cascade;
drop type if exists public.tipo_servico_enum       cascade;
drop type if exists public.porte_enum              cascade;
drop function if exists public.get_petshop_id()   cascade;

create extension if not exists "pgcrypto";

-- ============================================================
-- PETSHOPS
-- ============================================================
create table public.petshops (
  id         uuid        primary key default gen_random_uuid(),
  nome       text        not null,
  slug       text        unique not null,
  plano      text        not null default 'basico',
  ativo      boolean     not null default true,
  created_at timestamptz not null default now()
);

alter table public.petshops enable row level security;

-- ============================================================
-- USUARIOS (id = auth.uid())
-- Criado antes das policies de petshops pois elas referenciam esta tabela
-- ============================================================
create table public.usuarios (
  id         uuid primary key references auth.users(id) on delete cascade,
  petshop_id uuid not null references public.petshops(id) on delete cascade,
  nome       text not null,
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

create policy "Usuário vê apenas seu próprio registro"
  on public.usuarios for select to authenticated
  using (id = auth.uid());

-- ============================================================
-- Helper function — retorna petshop_id do usuário logado
-- security definer para bypassar RLS na tabela usuarios
-- ============================================================
create or replace function public.get_petshop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select petshop_id from public.usuarios where id = auth.uid()
$$;

-- Policy de petshops criada aqui, após usuarios e get_petshop_id() existirem
create policy "Autenticados veem seu petshop"
  on public.petshops for select to authenticated
  using (id = get_petshop_id());

-- ============================================================
-- CLIENTES
-- ============================================================
create table public.clientes (
  id          uuid        primary key default gen_random_uuid(),
  petshop_id  uuid        not null references public.petshops(id) on delete cascade,
  nome        text        not null,
  email       text        not null,
  telefone    text        not null,
  endereco    text,
  created_at  timestamptz not null default now(),
  unique (petshop_id, telefone)
);

alter table public.clientes enable row level security;

create policy "Autenticados veem clientes do seu petshop"
  on public.clientes for select to authenticated
  using (petshop_id = get_petshop_id());

create policy "Autenticados inserem clientes no seu petshop"
  on public.clientes for insert to authenticated
  with check (petshop_id = get_petshop_id());

create policy "Autenticados atualizam clientes do seu petshop"
  on public.clientes for update to authenticated
  using (petshop_id = get_petshop_id());

create policy "Autenticados excluem clientes do seu petshop"
  on public.clientes for delete to authenticated
  using (petshop_id = get_petshop_id());

-- ============================================================
-- PETS
-- ============================================================
create type public.porte_enum as enum ('pequeno', 'medio', 'grande');

create table public.pets (
  id           uuid             primary key default gen_random_uuid(),
  petshop_id   uuid             not null references public.petshops(id) on delete cascade,
  cliente_id   uuid             not null references public.clientes(id) on delete cascade,
  nome         text             not null,
  especie      text             not null,
  raca         text,
  porte        public.porte_enum not null default 'medio',
  nascimento   date,
  observacoes  text,
  created_at   timestamptz      not null default now()
);

alter table public.pets enable row level security;

create policy "Autenticados veem pets do seu petshop"
  on public.pets for select to authenticated
  using (petshop_id = get_petshop_id());

create policy "Autenticados inserem pets no seu petshop"
  on public.pets for insert to authenticated
  with check (petshop_id = get_petshop_id());

create policy "Autenticados atualizam pets do seu petshop"
  on public.pets for update to authenticated
  using (petshop_id = get_petshop_id());

create policy "Autenticados excluem pets do seu petshop"
  on public.pets for delete to authenticated
  using (petshop_id = get_petshop_id());

-- ============================================================
-- SERVIÇOS
-- ============================================================
create type public.tipo_servico_enum as enum (
  'banho', 'tosa', 'banho_e_tosa', 'consulta', 'vacina'
);

create table public.servicos (
  id                uuid                    primary key default gen_random_uuid(),
  petshop_id        uuid                    not null references public.petshops(id) on delete cascade,
  nome              text                    not null,
  tipo              public.tipo_servico_enum not null,
  descricao         text,
  preco             numeric(10, 2)          not null check (preco >= 0),
  duracao_minutos   integer                 not null check (duracao_minutos > 0),
  ativo             boolean                 not null default true
);

alter table public.servicos enable row level security;

create policy "Autenticados gerenciam serviços do seu petshop"
  on public.servicos for all to authenticated
  using (petshop_id = get_petshop_id())
  with check (petshop_id = get_petshop_id());

-- ============================================================
-- AGENDAMENTOS
-- ============================================================
create type public.status_agendamento_enum as enum (
  'pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado'
);

create table public.agendamentos (
  id             uuid                          primary key default gen_random_uuid(),
  petshop_id     uuid                          not null references public.petshops(id) on delete cascade,
  pet_id         uuid                          not null references public.pets(id) on delete cascade,
  data_hora      timestamptz                   not null,
  status         public.status_agendamento_enum not null default 'pendente',
  observacoes    text,
  preco_cobrado  numeric(10, 2)               not null check (preco_cobrado >= 0),
  foto_path      text,
  created_at     timestamptz                   not null default now()
);

alter table public.agendamentos enable row level security;

create policy "Autenticados veem agendamentos do seu petshop"
  on public.agendamentos for select to authenticated
  using (petshop_id = get_petshop_id());

create policy "Autenticados inserem agendamentos no seu petshop"
  on public.agendamentos for insert to authenticated
  with check (petshop_id = get_petshop_id());

create policy "Autenticados atualizam agendamentos do seu petshop"
  on public.agendamentos for update to authenticated
  using (petshop_id = get_petshop_id());

create policy "Autenticados excluem agendamentos do seu petshop"
  on public.agendamentos for delete to authenticated
  using (petshop_id = get_petshop_id());

-- ============================================================
-- AGENDAMENTO_SERVICOS (junção N:N)
-- ============================================================
create table public.agendamento_servicos (
  agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
  servico_id     uuid not null references public.servicos(id)     on delete restrict,
  primary key (agendamento_id, servico_id)
);

alter table public.agendamento_servicos enable row level security;

create policy "Autenticados gerenciam agendamento_servicos do seu petshop"
  on public.agendamento_servicos for all to authenticated
  using (
    exists (
      select 1 from public.agendamentos a
      where a.id = agendamento_id
        and a.petshop_id = get_petshop_id()
    )
  )
  with check (
    exists (
      select 1 from public.agendamentos a
      where a.id = agendamento_id
        and a.petshop_id = get_petshop_id()
    )
  );
