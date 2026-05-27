export type TipoServico = "banho" | "tosa" | "banho_e_tosa" | "consulta" | "vacina";
export type NivelAgitacao = "calmo" | "normal" | "agitado" | "agressivo";
export type StatusAgendamento = "pendente" | "confirmado" | "em_andamento" | "concluido" | "cancelado";
export type Porte = "pequeno" | "medio" | "grande";

export interface Petshop {
  id: string;
  nome: string;
  slug: string;
  plano: string;
  ativo: boolean;
  created_at: string;
}

export interface Usuario {
  id: string;
  petshop_id: string;
  nome: string;
  role: string;
  created_at: string;
}

export interface Cliente {
  id: string;
  petshop_id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco?: string;
  created_at: string;
}

export interface Pet {
  id: string;
  petshop_id: string;
  cliente_id: string;
  nome: string;
  especie: string;
  raca?: string;
  porte: Porte;
  nascimento?: string;
  observacoes?: string;
  created_at: string;
  cliente?: Pick<Cliente, "nome" | "telefone">;
}

export interface Servico {
  id: string;
  petshop_id: string;
  nome: string;
  tipo: TipoServico;
  descricao?: string;
  preco: number;
  duracao_minutos: number;
  ativo: boolean;
}

export interface AgendamentoServico {
  agendamento_id: string;
  servico_id: string;
  servico?: Servico;
}

export interface Prontuario {
  id: string;
  petshop_id: string;
  pet_id: string;
  alergias: string | null;
  condicoes_especiais: string | null;
  medicamentos: string | null;
  veterinario: string | null;
  nivel_agitacao: NivelAgitacao | null;
  aceita_outros_animais: boolean;
  observacoes_comportamento: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vacina {
  id: string;
  petshop_id: string;
  pet_id: string;
  nome: string;
  data_aplicacao: string;
  data_vencimento: string | null;
  created_at: string;
}

export interface Agendamento {
  id: string;
  petshop_id: string;
  pet_id: string;
  data_hora: string;
  status: StatusAgendamento;
  observacoes?: string;
  preco_cobrado: number;
  foto_path?: string;
  created_at: string;
  pet?: Pet & { cliente?: Pick<Cliente, "nome" | "telefone"> };
  agendamento_servicos?: AgendamentoServico[];
}
