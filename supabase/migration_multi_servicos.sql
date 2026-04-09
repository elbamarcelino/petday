-- =================================================================
-- Migração: múltiplos serviços por agendamento + políticas DELETE
-- Execute no SQL Editor do Supabase
-- =================================================================

-- 1. Tabela de junção agendamento ↔ serviços (N:N)
create table public.agendamento_servicos (
  agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
  servico_id     uuid not null references public.servicos(id) on delete restrict,
  primary key (agendamento_id, servico_id)
);

alter table public.agendamento_servicos enable row level security;

create policy "Autenticados gerenciam agendamento_servicos"
  on public.agendamento_servicos for all
  to authenticated using (true) with check (true);

-- 2. Migrar dados existentes para a nova tabela
insert into public.agendamento_servicos (agendamento_id, servico_id)
select id, servico_id
from public.agendamentos
where servico_id is not null;

-- 3. Remover coluna antiga
alter table public.agendamentos drop column servico_id;

-- 4. Políticas DELETE ausentes nas tabelas existentes
create policy "Autenticados excluem clientes"
  on public.clientes for delete to authenticated using (true);

create policy "Autenticados excluem pets"
  on public.pets for delete to authenticated using (true);

create policy "Autenticados excluem agendamentos"
  on public.agendamentos for delete to authenticated using (true);
