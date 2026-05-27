-- Rodar no SQL Editor do Supabase

create table if not exists caixa_movimentos (
  id          uuid          primary key default gen_random_uuid(),
  petshop_id  uuid          not null references petshops(id) on delete cascade,
  tipo        text          not null check (tipo in ('entrada', 'saida')),
  descricao   text          not null,
  valor       numeric(10,2) not null check (valor > 0),
  data        date          not null default current_date,
  created_at  timestamptz   not null default now()
);

alter table caixa_movimentos enable row level security;

create policy "petshop_caixa_movimentos"
  on caixa_movimentos for all
  using  (petshop_id = get_petshop_id())
  with check (petshop_id = get_petshop_id());
