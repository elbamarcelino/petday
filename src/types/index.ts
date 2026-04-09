export type TipoServico = "banho" | "tosa" | "banho_e_tosa" | "consulta" | "vacina";
export type StatusAgendamento = "pendente" | "confirmado" | "em_andamento" | "concluido" | "cancelado";
export type Porte = "pequeno" | "medio" | "grande";

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco?: string;
  created_at: string;
}

export interface Pet {
  id: string;
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

export interface Agendamento {
  id: string;
  pet_id: string;
  data_hora: string;
  status: StatusAgendamento;
  observacoes?: string;
  preco_cobrado: number;
  created_at: string;
  pet?: Pet & { cliente?: Pick<Cliente, "nome" | "telefone"> };
  agendamento_servicos?: AgendamentoServico[];
}
