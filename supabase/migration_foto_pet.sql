-- Adiciona caminho da foto no Storage à tabela de agendamentos
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS foto_path text;
