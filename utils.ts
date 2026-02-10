import { DailyRecord, DashboardMetrics, User } from './types';

// Month mapping for parsing Portuguese month names
const MONTH_MAP: { [key: string]: number } = {
  'JANEIRO': 0, 'FEVEREIRO': 1, 'MARÇO': 2, 'ABRIL': 3, 'MAIO': 4, 'JUNHO': 5,
  'JULHO': 6, 'AGOSTO': 7, 'SETEMBRO': 8, 'OUTUBRO': 9, 'NOVEMBRO': 10, 'DEZEMBRO': 11,
  // Short versions fallback
  'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
  'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
};

// --- AUTH / LICENSE UTILS ---

const USERS_STORAGE_KEY = 'insight_sales_users';

export const initializeUsers = (): void => {
  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  if (!existing) {
    // Default Admin
    const adminUser: User = {
      username: 'Admin',
      password: 'Bx3provisao06',
      role: 'admin',
      expirationDate: '2099-12-31', // Infinite license
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([adminUser]));
  }
};

export const getUsers = (): User[] => {
  initializeUsers(); // Ensure default exists
  const str = localStorage.getItem(USERS_STORAGE_KEY);
  return str ? JSON.parse(str) : [];
};

export const saveUser = (newUser: User): void => {
  const users = getUsers();
  // Check if exists
  const exists = users.find(u => u.username.toLowerCase() === newUser.username.toLowerCase());
  if (exists) {
    throw new Error('Usuário já existe.');
  }
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const deleteUser = (username: string): void => {
  let users = getUsers();
  users = users.filter(u => u.username !== username);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const checkLicenseValidity = (user: User): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(user.expirationDate);
  expiration.setHours(0, 0, 0, 0); // End of that day
  
  // Se a data de expiração for maior ou igual a hoje, é válido
  // Precisamos garantir que não expirou ONTEM.
  // Se expiration = 2023-10-10, e hoje é 2023-10-11, expirou.
  return today <= expiration;
};


// Helper to parse currency string "R$ 1.500,00" -> 1500.00
export const parseCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleanStr = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanStr) || 0;
};

// Helper to parse integer safely
export const parseIntSafe = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseInt(value.toString().replace(/\D/g, ''), 10) || 0;
};

// Parse standard DD/MM/YYYY
export const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date();
};

export const calculateMetrics = (data: DailyRecord[]): DashboardMetrics => {
  const totalLeads = data.reduce((acc, curr) => acc + curr.leads, 0);
  const totalGanhos = data.reduce((acc, curr) => acc + curr.vendasQtd, 0); // Usando VENDAS DIA (Qtd)
  const faturamentoTotal = data.reduce((acc, curr) => acc + curr.faturamento, 0);
  const totalSemResposta = data.reduce((acc, curr) => acc + curr.semResposta, 0);
  const totalEmEntrada = data.reduce((acc, curr) => acc + curr.emEntrada, 0);
  const totalDesqualificados = data.reduce((acc, curr) => acc + curr.desqualificado, 0);
  const totalVendaNaoConcluida = data.reduce((acc, curr) => acc + curr.vendaNaoConcluida, 0);
  const totalAtendidos = data.reduce((acc, curr) => acc + curr.atendimento, 0);
  const investimentoTotal = data.reduce((acc, curr) => acc + curr.investimento, 0);

  const conversao = totalLeads > 0 ? (totalGanhos / totalLeads) * 100 : 0;
  const ticketMedio = totalGanhos > 0 ? faturamentoTotal / totalGanhos : 0;
  const semRespostaRate = totalLeads > 0 ? (totalSemResposta / totalLeads) * 100 : 0;
  
  const qualidadeDenominator = totalGanhos + totalDesqualificados; // Fallback logic
  const qualidadeRate = totalLeads > 0 ? (totalAtendidos / totalLeads) * 100 : 0; // Using prompted logic: Atendidos / Leads

  return {
    totalLeads,
    totalGanhos,
    faturamentoTotal,
    conversao,
    ticketMedio,
    totalEmEntrada,
    totalSemResposta,
    semRespostaRate,
    totalDesqualificados,
    totalVendaNaoConcluida,
    totalAtendidos,
    qualidadeRate,
    investimentoTotal
  };
};

// Mock data generator updated
export const generateMockData = (): DailyRecord[] => {
  const records: DailyRecord[] = [];
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const sellers = ['Ana Silva', 'Bruno Costa', 'Carlos Oliveira', 'Daniela Souza', 'Eduardo Lima'];
  const today = new Date();
  
  for (let i = 0; i < 90; i++) { // Increased to 90 days for better seller distribution
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Create multiple records per day for different sellers
    const sellersForDay = Math.floor(Math.random() * 3) + 1; // 1 to 3 sellers active per day in mock

    for (let j = 0; j < sellersForDay; j++) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      const leads = Math.floor(Math.random() * 20) + 5;
      
      // Adjusted Logic for Lead Quality Simulation
      const semResposta = Math.floor(leads * (Math.random() * 0.2)); 
      const emEntrada = Math.floor(Math.random() * 2); // Simulating neglected leads
      const desqualificado = Math.floor(leads * 0.3); // High disqualification for demo
      
      // Atendimento is whatever is left processed
      const atendimento = Math.max(0, leads - semResposta - emEntrada); 
      
      const vendasQtd = Math.floor(atendimento * 0.15); 
      const vendaNaoConcluida = Math.max(0, atendimento - desqualificado - vendasQtd);
      const atendimentoEmAberto = Math.max(0, atendimento - desqualificado - vendasQtd - vendaNaoConcluida);
      const faturamento = vendasQtd * (Math.floor(Math.random() * 500) + 200);

      records.push({
        id: `${i}-${j}`,
        data: date.toLocaleDateString('pt-BR'),
        dateObj: date,
        diaSemana: days[date.getDay()],
        vendedor: seller,
        investimento: Math.floor(Math.random() * 100), // Individual investment logic
        seguidores: Math.floor(Math.random() * 5),
        leads,
        emEntrada,
        semResposta,
        atendimento,
        retornoAtendimento: Math.floor(Math.random() * 5),
        desqualificado,
        atendimentoEmAberto: atendimentoEmAberto,
        vendaNaoConcluida,
        ganho: vendasQtd,
        vendasQtd: vendasQtd,
        faturamento: faturamento
      });
    }
  }
  return records.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
};

const splitCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(col => col.replace(/^"|"$/g, '').trim());
};

const getDayOfWeek = (date: Date): string => {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[date.getDay()];
};

export const getGoogleSheetExportUrl = (url: string): string | null => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
  }
  return null;
};

// Helper to find index by header name (fuzzy search)
const findIdx = (headers: string[], keys: string[]): number => {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toUpperCase();
    if (keys.some(k => h.includes(k))) return i;
  }
  return -1;
};

export const parseCSV = (csvText: string, fileIndex: number = 0): DailyRecord[] => {
  const lines = csvText.split(/\r?\n/);
  const records: DailyRecord[] = [];
  
  let headerRowIndex = -1;
  
  // Try to find header row with critical columns
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toUpperCase();
    if (line.includes('LEADS') || (line.includes('DIA') && line.includes('ANO')) || line.includes('VENDEDOR')) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1 && lines.length > 0) headerRowIndex = 0;

  const headers = splitCSVLine(lines[headerRowIndex]);
  
  // Map columns based on headers
  const idxVendedor = findIdx(headers, ['VENDEDOR', 'RESPONSAVEL', 'CONSULTOR', 'EQUIPE', 'NOME']);
  const idxInvestimento = findIdx(headers, ['INVESTIMENTO']);
  const idxLeads = findIdx(headers, ['LEADS TOTAIS', 'LEADS']);
  const idxAtendimento = findIdx(headers, ['ATENDIMENTO', 'ATENDIDOS']);
  const idxVNC = findIdx(headers, ['V. N. CONCL', 'VENDA NAO CONCLUIDA', 'PERDIDOS']);
  const idxVendasQtd = findIdx(headers, ['VENDAS DIA', 'QTD VENDAS', 'VENDAS']); // Prioritize explicit Qtd
  const idxFaturamento = findIdx(headers, ['P. REAL', 'FATURAMENTO', 'RECEITA']);
  
  // Lead Quality specifics
  const idxEntrada = findIdx(headers, ['EM ENTRADA', 'ENTRADA', 'NAO ATENDIDO', 'FILA']);
  const idxSemRetorno = findIdx(headers, ['SEM RESPOSTA', 'SEM RETORNO']);
  const idxDesq = findIdx(headers, ['DESQUALIFICADO', 'DESQ']);

  // Backup indices if header parsing fails (based on previous format)
  // New Format Fallback: Inv=?, Leads=4, Atend=8, VNC=22, VendasQtd=24, Fat=25
  const fallback = {
    inv: 3, leads: 4, atend: 8, vnc: 22, vqtd: 24, fat: 25
  };

  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = splitCSVLine(line);
    if (cols.length < 5) continue;

    try {
      const rowId = `file-${fileIndex}-row-${i}`;
      
      // Date Parsing
      let dateObj = new Date();
      let dataStr = '';
      
      const idxAno = 0;
      const idxDia = 1;
      const idxMes = 2;
      
      if (cols[idxAno] && cols[idxAno].length === 4 && parseIntSafe(cols[idxAno]) > 2000) {
         // Assume New Format Structure (Ano, Dia, Mes)
         const year = parseIntSafe(cols[idxAno]);
         const day = parseIntSafe(cols[idxDia]);
         const monthStr = cols[idxMes].toUpperCase();
         const month = MONTH_MAP[monthStr] ?? 0;
         dateObj = new Date(year, month, day);
         dataStr = `${day < 10 ? '0'+day : day}/${month < 9 ? '0'+(month+1) : month+1}/${year}`;
      } else {
         // Assume standard format with date in first column
         dataStr = cols[0];
         dateObj = parseDate(dataStr);
      }

      // Extraction with fallback
      const vendedor = idxVendedor > -1 ? cols[idxVendedor] : 'Geral';
      const investimento = parseCurrency(cols[idxInvestimento > -1 ? idxInvestimento : fallback.inv]);
      const leads = parseIntSafe(cols[idxLeads > -1 ? idxLeads : fallback.leads]);
      const atendimento = parseIntSafe(cols[idxAtendimento > -1 ? idxAtendimento : fallback.atend]);
      const vendaNaoConcluida = parseIntSafe(cols[idxVNC > -1 ? idxVNC : fallback.vnc]);
      
      // Vendas Qtd
      let vendasQtd = parseIntSafe(cols[idxVendasQtd > -1 ? idxVendasQtd : fallback.vqtd]);
      
      // Faturamento (P. Real)
      let faturamento = parseCurrency(cols[idxFaturamento > -1 ? idxFaturamento : fallback.fat]);

      const desqualificado = parseIntSafe(cols[idxDesq > -1 ? idxDesq : 7]);
      const semResposta = parseIntSafe(cols[idxSemRetorno > -1 ? idxSemRetorno : 6]);
      const emEntrada = parseIntSafe(cols[idxEntrada > -1 ? idxEntrada : 5]); // Default column index if not found
      
      const atendimentoEmAberto = Math.max(0, atendimento - (vendasQtd + vendaNaoConcluida + desqualificado));

      records.push({
        id: rowId,
        data: dataStr,
        dateObj: dateObj,
        diaSemana: getDayOfWeek(dateObj),
        vendedor: vendedor || 'Não Identificado',
        investimento,
        seguidores: 0,
        leads,
        emEntrada,
        semResposta,
        atendimento,
        retornoAtendimento: 0,
        desqualificado,
        atendimentoEmAberto, 
        vendaNaoConcluida,
        ganho: vendasQtd, 
        vendasQtd,
        faturamento
      });

    } catch (e) {
      console.error(`Error parsing row ${i}`, e);
    }
  }
  return records;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const formatPercent = (val: number) => {
  return `${val.toFixed(1)}%`;
};