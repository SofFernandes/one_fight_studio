export type Papel = "aluna" | "admin";
export type Modalidade = "personal" | "grupo" | "totalpass_wellhub";
export type StatusMensalidade = "pendente" | "pago" | "vencido" | "cancelado";

export interface Profile {
  id: string;
  nome_completo: string;
  telefone: string | null;
  data_nascimento: string | null;
  papel: Papel;
  modalidade: Modalidade | null;
  foto_antes_url: string | null;
  foto_atual_url: string | null;
  dia_vencimento: number | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Plano {
  id: string;
  modalidade: Modalidade;
  nome: string;
  valor_centavos: number;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  criado_em: string;
}

export interface AlunaPlano {
  aluna_id: string;
  plano_id: string;
  criado_em: string;
}

export interface Mensalidade {
  id: string;
  aluna_id: string;
  plano_id: string | null;
  competencia: string;
  valor_centavos: number;
  vencimento: string;
  pago_em: string | null;
  status: StatusMensalidade;
  criado_em: string;
}

export interface ReceitaMensal {
  competencia: string;
  receita_paga_centavos: number;
  receita_em_aberto_centavos: number;
  qtd_pagas: number;
  qtd_alunas: number;
}

export interface AlunasAtivasMensal {
  competencia: string;
  alunas_ativas: number;
}
