export interface DailyRecord {
  id: string;
  data: string; // Original date string
  dateObj: Date; // Parsed date object
  diaSemana: string;
  vendedor: string; // Novo campo para Performance de Vendedores
  
  // Métricas
  investimento: number; // Novo campo
  seguidores: number;
  leads: number; // LEADS TOTAIS
  emEntrada: number;
  semResposta: number;
  atendimento: number; // ATENDIMENTO
  retornoAtendimento: number;
  desqualificado: number;
  atendimentoEmAberto: number;
  vendaNaoConcluida: number; // V. N. CONCL
  ganho: number; // Vendas via Ganho (backup)
  
  vendasQtd: number; // VENDAS DIA (Quantidade)
  faturamento: number; // P. REAL (Valor R$)
}

export interface DashboardMetrics {
  totalLeads: number;
  totalGanhos: number;
  faturamentoTotal: number;
  conversao: number;
  ticketMedio: number;
  totalEmEntrada: number; // Novo campo
  totalSemResposta: number; // Novo campo (absoluto)
  semRespostaRate: number;
  totalDesqualificados: number;
  totalVendaNaoConcluida: number;
  totalAtendidos: number;
  qualidadeRate: number;
  investimentoTotal: number;
}

export enum ViewState {
  LOGIN = 'LOGIN',
  UPLOAD = 'UPLOAD', // Mantido para compatibilidade interna, mas o fluxo principal usará SETTINGS
  OVERVIEW = 'OVERVIEW',
  LEAD_QUALITY = 'LEAD_QUALITY',
  SERVICE_EFFICIENCY = 'SERVICE_EFFICIENCY',
  SALES_PERFORMANCE = 'SALES_PERFORMANCE',
  SELLER_ANALYSIS = 'SELLER_ANALYSIS', 
  WEEKDAY_ANALYSIS = 'WEEKDAY_ANALYSIS',
  DAILY_ANALYSIS = 'DAILY_ANALYSIS',
  MONTHLY_ANALYSIS = 'MONTHLY_ANALYSIS',
  ALERTS = 'ALERTS',
  SETTINGS = 'SETTINGS', // Nova view
}

export interface User {
  username: string;
  password: string;
  role: 'admin' | 'user';
  expirationDate: string; // ISO Date string (YYYY-MM-DD)
  createdAt: string;
}

export type Theme = 'light' | 'dark';