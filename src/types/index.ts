export type AgendamentoStatus = 'AGENDADO' | 'COMPARECEU' | 'NAO_COMPARECEU';
export type OrigemAgendamento = 'PLANILHA' | 'MANUAL'; // Novo tipo para a origem

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
  guiche?: string;
  atendente?: string;
  tipo?: string;
  compareceu?: boolean | null;
  observacoes?: string;
  status_atendimento?: string; // Este campo agora será apenas o status de atendimento (AGENDADO, COMPARECEU, NAO_COMPARECEU)
  origem_agendamento?: OrigemAgendamento; // Novo campo para a origem do agendamento
  solicitacao_aluno?: string; // Novo campo para a solicitação do aluno
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

export type UserRole = 'ADMIN' | 'ATENDENTE' | 'TRIAGEM' | 'GESTOR'; // Adicionado GESTOR

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

// --- NEW CRM TYPES ---

export type LeadStatus =
  | 'NOVO'
  | 'EM_ATENDIMENTO'
  | 'INTERESSADO'
  | 'VISITA_AGENDADA'
  | 'INSCRITO'
  | 'MATRICULADO'
  | 'PERDIDO';

export type InteractionChannel = 'WHATSAPP' | 'TELEFONE' | 'EMAIL' | 'PRESENCIAL';

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  phone?: string;
  email?: string;
  cpf?: string;
  course?: string;
  modality?: string;
  turn?: string;
  origin?: string;
  campaign?: string;
  unit?: string;
  status: LeadStatus;
  observations?: string;
  user_id?: string; // Attendant assigned
  last_contact_date?: string;
  follow_up_date?: string;
}

export interface Interaction {
  id: string;
  created_at: string;
  lead_id: string;
  user_id: string;
  channel?: InteractionChannel;
  description: string;
  status_after_contact?: LeadStatus;
}