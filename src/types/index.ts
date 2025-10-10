export type AgendamentoStatus = 'AGENDADO' | 'COMPARECEU' | 'NAO_COMPARECEU';

export interface Agendamento {
  id: string;
  user_id?: string;
  nome_aluno: string;
  matricula?: string;
  data_agendamento: string;
  horario?: string;
  tipo_atendimento?: string;
  status: AgendamentoStatus;
  created_at: string;

  // Campos da Planilha
  processo_id?: string;
  unidade_agendamento?: string;
  guiche?: string;
  atendente?: string;
  tipo?: string;
  compareceu?: boolean | null;
  observacoes?: string;
  status_atendimento?: string;
}

export interface Atendente {
  id: string;
  name: string;
  guiche?: string; // Adicionado o campo guiche
  created_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  created_at: string;
}

export type UserRole = 'ADMIN' | 'ATENDENTE' | 'TRIAGEM'; // Definindo os possíveis papéis de usuário

export interface Profile {
  id: string;
  first_name?: string; // Alterado de full_name para first_name
  last_name?: string;  // Adicionado last_name
  avatar_url?: string;
  role: UserRole; // A função do usuário
  updated_at?: string;
}

export interface AttendantPerformance {
  atendente: string;
  count: number;
}